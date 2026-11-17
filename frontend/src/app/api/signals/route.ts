import { NextResponse } from "next/server";
import { WATCHLIST, fetchKlines, fetchMarketExtras } from "@/lib/api/binance";
import { analyzeSymbol, type EngineSignal } from "@/lib/signal-engine";
import { publishCandidates, runMonitor, getRecords, getConfig } from "@/lib/server/signal-store";

/**
 * Sinyal motoru orkestrasyon endpoint'i:
 * 1. İzleme listesini tarar (4 dk cache — tüm kullanıcılar aynı taramayı görür).
 * 2. Yayın filtrelerini geçen kurulumları immutable snapshot olarak kaydeder.
 * 3. Açık sinyallerin yaşam döngüsünü günceller (monitor, en fazla dakikada bir).
 * 4. Hem tarama görünümünü hem yayınlanmış sinyalleri döndürür.
 */

const SCAN_TTL_MS = 4 * 60 * 1000;
const MONITOR_TTL_MS = 60 * 1000;

interface ScanCache {
  timestamp: number;
  data: EngineSignal[];
}

let scanCache: ScanCache | null = null;
let inflight: Promise<EngineSignal[]> | null = null;
let lastMonitorAt = 0;

async function runScan(): Promise<EngineSignal[]> {
  const threshold = getConfig().publishThreshold;
  const results = await Promise.allSettled(
    WATCHLIST.map(async (symbol) => {
      const [k4h, k1h, extras] = await Promise.all([
        fetchKlines(symbol, "4h", 250),
        fetchKlines(symbol, "1h", 250),
        fetchMarketExtras(symbol),
      ]);
      return analyzeSymbol(symbol, k4h, k1h, extras, threshold);
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<EngineSignal> => r.status === "fulfilled")
    .map((r) => r.value)
    .sort((a, b) => b.score - a.score);
}

export async function GET() {
  const now = Date.now();

  try {
    // ── Tarama (cache'li) ──
    let scan: EngineSignal[];
    let scannedAt: number;

    if (scanCache && now - scanCache.timestamp < SCAN_TTL_MS) {
      scan = scanCache.data;
      scannedAt = scanCache.timestamp;
    } else {
      if (!inflight) {
        inflight = runScan().finally(() => { inflight = null; });
      }
      scan = await inflight;
      if (scan.length === 0 && scanCache) {
        scan = scanCache.data;
        scannedAt = scanCache.timestamp;
      } else {
        scannedAt = now;
        scanCache = { timestamp: now, data: scan };
        // Yeni tarama → yayın adaylarını değerlendir (immutable snapshot)
        publishCandidates(scan);
      }
    }

    // ── Monitor (throttle: dakikada bir) ──
    if (now - lastMonitorAt > MONITOR_TTL_MS) {
      lastMonitorAt = now;
      await runMonitor();
    }

    return NextResponse.json({
      signals: scan,
      published: getRecords(),
      config: { publishThreshold: getConfig().publishThreshold },
      scannedAt: new Date(scannedAt).toISOString(),
    });
  } catch {
    if (scanCache) {
      return NextResponse.json({
        signals: scanCache.data,
        published: getRecords(),
        config: { publishThreshold: getConfig().publishThreshold },
        scannedAt: new Date(scanCache.timestamp).toISOString(),
        stale: true,
      });
    }
    return NextResponse.json({ signals: [], published: [], scannedAt: null, error: "Scan failed" }, { status: 502 });
  }
}
