/**
 * Sinyal deposu — JSON dosya tabanlı kalıcılık (server-only).
 *
 * Kurallar:
 * - Snapshot bir kez yazılır, ASLA değiştirilmez (immutable).
 * - Yalnızca durum/istatistik alanları güncellenir (lifecycle).
 * - Her yayın/red kararı audit log'a işlenir.
 *
 * Not: PostgreSQL entegrasyonu yapıldığında bu modülün arayüzü korunarak
 * içi DB çağrılarıyla değiştirilecek.
 */
import fs from "fs";
import path from "path";
import { fetchKlines, type Kline } from "@/lib/api/binance";
import type { EngineSignal } from "@/lib/signal-engine";
import {
  type SignalRecord, type SignalSnapshot, type AuditEntry, type SignalConfig,
  DEFAULT_CONFIG, OPEN_STATUSES,
} from "@/lib/signal-types";
import { ENGINE_VERSION, EXPIRATION_HOURS } from "@/lib/signal-engine";

interface StoreData {
  config: SignalConfig;
  records: SignalRecord[];
  audit: AuditEntry[];
}

const STORE_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(STORE_DIR, "signals.json");
const MAX_AUDIT = 300;
const MAX_RECORDS = 500;

function load(): StoreData {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    const data = JSON.parse(raw) as StoreData;
    return {
      config: { ...DEFAULT_CONFIG, ...data.config },
      records: data.records ?? [],
      audit: data.audit ?? [],
    };
  } catch {
    return { config: { ...DEFAULT_CONFIG }, records: [], audit: [] };
  }
}

function save(data: StoreData): void {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function getConfig(): SignalConfig {
  return load().config;
}

export function setConfig(partial: Partial<SignalConfig>): SignalConfig {
  const data = load();
  data.config = { ...data.config, ...partial };
  save(data);
  return data.config;
}

export function getRecords(): SignalRecord[] {
  return load().records;
}

/** Yalnızca arşivlenmemiş kayıtlar — dashboard / PnL özeti için */
export function getActiveRecords(): SignalRecord[] {
  return load().records.filter((r) => !r.archived);
}

export function getAudit(): AuditEntry[] {
  return load().audit;
}

/** Sinyali arşivle — monitor durur, durum dondurulur, PnL özetine dahil edilmez */
export function archiveSignal(id: string): SignalRecord | null {
  const data = load();
  const rec = data.records.find((r) => r.snapshot.id === id);
  if (!rec) return null;
  rec.archived = true;
  rec.archivedAt = new Date().toISOString();
  rec.statusAtArchive = rec.status;
  save(data);
  return rec;
}

/** Arşivden geri al — durum arşiv anındaki gibi kalır; geçmiş mumlar yeniden işlenmez */
export function unarchiveSignal(id: string): SignalRecord | null {
  const data = load();
  const rec = data.records.find((r) => r.snapshot.id === id);
  if (!rec) return null;

  const now = Date.now();
  if (rec.archivedAt) {
    rec.archivePauseMs = (rec.archivePauseMs ?? 0) + (now - new Date(rec.archivedAt).getTime());
  }

  // Arşiv anındaki durumu geri yükle (arşiv/çıkarma kapatma sebebi olmamalı)
  const frozen = rec.statusAtArchive;
  if (frozen && OPEN_STATUSES.includes(frozen)) {
    rec.status = frozen;
    rec.stoppedAt = null;
    rec.closedAt = null;
    rec.expiredAt = null;
    rec.tradeDurationMin = null;
    if (frozen === "WAITING") {
      rec.entryTriggeredAt = null;
      rec.tp1HitAt = null;
      rec.tp2HitAt = null;
      rec.tp3HitAt = null;
      rec.pnl = null;
    } else if (frozen === "ACTIVE") {
      rec.tp1HitAt = null;
      rec.tp2HitAt = null;
      rec.tp3HitAt = null;
    } else if (frozen === "TP1_HIT") {
      rec.tp2HitAt = null;
      rec.tp3HitAt = null;
    } else if (frozen === "TP2_HIT") {
      rec.tp3HitAt = null;
    }
  }

  rec.archived = false;
  rec.archivedAt = null;
  rec.statusAtArchive = null;
  // Bundan sonra yalnızca yeni mumlar izlenir — arşiv süresindeki fiyat hareketi yok sayılır
  rec.lastCheckedAt = new Date(now).toISOString();
  save(data);
  return rec;
}

/** Sinyali kalıcı olarak sil — PnL dahil tüm izler kalkar */
export function deleteSignal(id: string): boolean {
  const data = load();
  const idx = data.records.findIndex((r) => r.snapshot.id === id);
  if (idx === -1) return false;
  data.records.splice(idx, 1);
  save(data);
  return true;
}

function addAudit(data: StoreData, entry: AuditEntry): void {
  data.audit.unshift(entry);
  if (data.audit.length > MAX_AUDIT) data.audit.length = MAX_AUDIT;
}

/**
 * Tarama sonuçlarından yayın adaylarını filtreler, geçenleri immutable snapshot
 * olarak kaydeder. Her kararı audit'e işler.
 */
export function publishCandidates(scan: EngineSignal[]): { published: number } {
  const data = load();
  const now = new Date();
  let published = 0;

  for (const s of scan) {
    // Skoru düşükleri sessizce geç (audit'i şişirmemek için sadece 60+ değerlendirilir)
    if (s.score < 60) continue;

    const reasons: string[] = [];

    if (s.score < data.config.publishThreshold) {
      reasons.push(`Score ${s.score} < publish threshold ${data.config.publishThreshold}`);
    }
    if (s.regime !== "TREND") {
      reasons.push(`Ranging market (ADX ${s.adx.toFixed(0)}) — regime gate`);
    }
    if (s.direction === "NEUTRAL") {
      reasons.push("No clear direction");
    }
    if (s.quoteVolume24h < data.config.minQuoteVolume24h) {
      reasons.push(`Insufficient volume ($${(s.quoteVolume24h / 1e6).toFixed(0)}M < $${(data.config.minQuoteVolume24h / 1e6).toFixed(0)}M)`);
    }
    if (s.atrPct < data.config.minAtrPct) {
      reasons.push(`Dead market (ATR ${s.atrPct.toFixed(2)}% < ${data.config.minAtrPct}%)`);
    }

    // Aynı coin için açık (ve arşivlenmemiş) sinyal varsa yenisini üretme
    const openSame = data.records.find(
      (r) => r.snapshot.symbol === s.symbol && !r.archived && OPEN_STATUSES.includes(r.status)
    );
    if (openSame) {
      reasons.push(`Open signal exists (${openSame.snapshot.id})`);
    }

    // Cooldown: aynı coin+yön için son kapanıştan itibaren bekleme
    const cooldownMs = data.config.cooldownHours * 3600_000;
    const recentSame = data.records.find(
      (r) =>
        r.snapshot.symbol === s.symbol &&
        r.snapshot.direction === s.direction &&
        !OPEN_STATUSES.includes(r.status) &&
        now.getTime() - new Date(r.closedAt ?? r.expiredAt ?? r.stoppedAt ?? r.snapshot.generatedAt).getTime() < cooldownMs
    );
    if (recentSame) {
      reasons.push(`Cooldown active (${data.config.cooldownHours}h) — recent signal in same direction`);
    }

    if (reasons.length > 0) {
      addAudit(data, {
        time: now.toISOString(),
        symbol: s.symbol,
        direction: s.direction,
        score: s.score,
        quality: s.quality,
        decision: "REJECTED",
        reasons,
      });
      continue;
    }

    // ── Yayınla: snapshot kilitle ──
    const expiresAt = new Date(now.getTime() + EXPIRATION_HOURS[s.holdingType] * 3600_000).toISOString();
    const snapshot: SignalSnapshot = {
      id: `${s.base}-${now.getTime()}`,
      symbol: s.symbol,
      base: s.base,
      name: s.name,
      direction: s.direction as "LONG" | "SHORT",
      entry: s.entry,
      stopLoss: s.stopLoss,
      takeProfit: s.takeProfit,
      confidence: s.score,
      aiScore: s.aiScore,
      quality: s.quality,
      riskReward: s.riskReward,
      risk: s.risk,
      atrPct: s.atrPct,
      holdingType: s.holdingType,
      estimatedDuration: s.estimatedDuration,
      expiresAt,
      signalReason: s.rationale,
      marketConditions: {
        regime: s.regime,
        adx: s.adx,
        quoteVolume24h: s.quoteVolume24h,
      },
      indicatorValues: s.indicatorValues,
      components: s.components,
      strategyVersion: ENGINE_VERSION,
      timeframe: s.timeframe,
      generatedAt: s.generatedAt,
    };

    data.records.unshift({
      snapshot,
      status: "WAITING",
      entryTriggeredAt: null,
      tp1HitAt: null,
      tp2HitAt: null,
      tp3HitAt: null,
      stoppedAt: null,
      closedAt: null,
      expiredAt: null,
      pnl: null,
      maxProfitPct: 0,
      maxDrawdownPct: 0,
      tradeDurationMin: null,
      lastCheckedAt: now.toISOString(),
      archived: false,
      archivedAt: null,
      statusAtArchive: null,
      archivePauseMs: 0,
    });
    published += 1;

    addAudit(data, {
      time: now.toISOString(),
      symbol: s.symbol,
      direction: s.direction,
      score: s.score,
      quality: s.quality,
      decision: "PUBLISHED",
      reasons: [
        `All filters passed — ${s.quality === "PREMIUM" ? "Premium" : "High"} quality`,
        `Module confirmations: ${s.components.filter((c) => c.earned).map((c) => c.module).join(", ")}`,
      ],
    });
  }

  if (data.records.length > MAX_RECORDS) data.records.length = MAX_RECORDS;
  save(data);
  return { published };
}

/** Yön işaretli getiri (%) */
function pnlPct(direction: "LONG" | "SHORT", entry: number, price: number): number {
  const raw = ((price - entry) / entry) * 100;
  return direction === "LONG" ? raw : -raw;
}

/** Kademeli çıkış varsayımı: pozisyonun 1/3'ü her TP'de kapanır */
function realizedPnl(rec: SignalRecord, exitPrice: number): number {
  const { direction, entry, takeProfit } = rec.snapshot;
  const hits: number[] = [];
  if (rec.tp1HitAt) hits.push(pnlPct(direction, entry, takeProfit[0]));
  if (rec.tp2HitAt) hits.push(pnlPct(direction, entry, takeProfit[1]));
  if (rec.tp3HitAt) hits.push(pnlPct(direction, entry, takeProfit[2]));
  const remaining = 3 - hits.length;
  const exitPart = pnlPct(direction, entry, exitPrice);
  return (hits.reduce((a, b) => a + b, 0) + exitPart * remaining) / 3;
}

/**
 * Açık sinyallerin yaşam döngüsünü günceller.
 * Snapshot'a dokunmaz — yalnızca durum/istatistik alanları değişir.
 * Tespit: 15 dakikalık mumların high/low değerleriyle. SL ve TP aynı mumda ise SL önceliklidir (muhafazakâr).
 */
export async function runMonitor(): Promise<void> {
  const data = load();
  // Arşivlenen sinyaller izlenmez — PnL güncellenmez
  const open = data.records.filter((r) => !r.archived && OPEN_STATUSES.includes(r.status));
  if (open.length === 0) return;

  const now = new Date();

  await Promise.allSettled(
    open.map(async (rec) => {
      const snap = rec.snapshot;
      const genTime = new Date(snap.generatedAt).getTime();
      const lastChecked = new Date(rec.lastCheckedAt).getTime();
      // Arşiv sonrası veya normal tur: yalnızca son kontrolden itibaren mumlar (geçmiş yeniden işlenmez)
      const fromTime = Math.max(genTime - 15 * 60000, lastChecked - 15 * 60000);
      const minutesSince = (now.getTime() - fromTime) / 60000;
      const limit = Math.min(1000, Math.max(3, Math.ceil(minutesSince / 15) + 2));

      let klines: Kline[];
      try {
        klines = await fetchKlines(snap.symbol, "15m", limit);
      } catch {
        return;
      }
      const relevant = klines.filter((k) => k.time * 1000 >= fromTime);
      if (relevant.length === 0) {
        rec.lastCheckedAt = now.toISOString();
        return;
      }

      const isLong = snap.direction === "LONG";
      const currentPrice = relevant[relevant.length - 1].close;
      const effectiveExpiresAt = new Date(snap.expiresAt).getTime() + (rec.archivePauseMs ?? 0);

      for (const candle of relevant) {
        // ── WAITING: entry tetiklenme kontrolü ──
        if (rec.status === "WAITING") {
          const candleEnd = (candle.time + 15 * 60) * 1000;
          const triggered = isLong ? candle.low <= snap.entry : candle.high >= snap.entry;
          if (triggered) {
            rec.status = "ACTIVE";
            rec.entryTriggeredAt = new Date(Math.max(candle.time * 1000, genTime)).toISOString();
          } else if (candleEnd > effectiveExpiresAt) {
            rec.status = "EXPIRED";
            rec.expiredAt = new Date(effectiveExpiresAt).toISOString();
            rec.pnl = null;
            break;
          }
        }

        if (!["ACTIVE", "TP1_HIT", "TP2_HIT"].includes(rec.status)) continue;

        // ── Açık pozisyon: uç değerleri izle ──
        const highPnl = pnlPct(snap.direction, snap.entry, isLong ? candle.high : candle.low);
        const lowPnl = pnlPct(snap.direction, snap.entry, isLong ? candle.low : candle.high);
        rec.maxProfitPct = Math.max(rec.maxProfitPct, highPnl);
        rec.maxDrawdownPct = Math.min(rec.maxDrawdownPct, lowPnl);

        // SL kontrolü (aynı mumda TP ile çakışırsa SL öncelikli — muhafazakâr)
        const slHit = isLong ? candle.low <= snap.stopLoss : candle.high >= snap.stopLoss;
        if (slHit) {
          rec.status = "STOPPED";
          rec.stoppedAt = new Date(candle.time * 1000).toISOString();
          rec.closedAt = rec.stoppedAt;
          rec.pnl = realizedPnl(rec, snap.stopLoss);
          break;
        }

        // TP kontrolleri — sıralı ilerleme
        const tpReached = (tp: number) => (isLong ? candle.high >= tp : candle.low <= tp);
        if (rec.status === "ACTIVE" && tpReached(snap.takeProfit[0])) {
          rec.status = "TP1_HIT";
          rec.tp1HitAt = new Date(candle.time * 1000).toISOString();
        }
        if (rec.status === "TP1_HIT" && tpReached(snap.takeProfit[1])) {
          rec.status = "TP2_HIT";
          rec.tp2HitAt = new Date(candle.time * 1000).toISOString();
        }
        if (rec.status === "TP2_HIT" && tpReached(snap.takeProfit[2])) {
          rec.status = "TP3_HIT";
          rec.tp3HitAt = new Date(candle.time * 1000).toISOString();
          rec.closedAt = rec.tp3HitAt;
          rec.status = "CLOSED";
          rec.pnl = realizedPnl(rec, snap.takeProfit[2]);
          break;
        }
      }

      // Hâlâ açıksa: anlık PnL ve süre
      if (OPEN_STATUSES.includes(rec.status) && rec.status !== "WAITING") {
        rec.pnl = realizedPnl(rec, currentPrice);
      }
      if (rec.closedAt || rec.expiredAt) {
        const endTime = new Date(rec.closedAt ?? rec.expiredAt!).getTime();
        const startTime = rec.entryTriggeredAt ? new Date(rec.entryTriggeredAt).getTime() : genTime;
        rec.tradeDurationMin = Math.round((endTime - startTime) / 60000);
      }
      rec.lastCheckedAt = now.toISOString();
    })
  );

  save(data);
}
