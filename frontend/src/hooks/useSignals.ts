"use client";
import { useCallback, useEffect, useState } from "react";
import type { EngineSignal } from "@/lib/signal-engine";
import type { SignalRecord } from "@/lib/signal-types";

export interface SignalScan {
  signals: EngineSignal[];
  published: SignalRecord[];
  publishThreshold: number;
  scannedAt: string | null;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
}

/** Sinyal motoru taramasını ve yayınlanmış sinyalleri çeker, 2 dakikada bir yeniler */
export function useSignals(): SignalScan {
  const [signals, setSignals] = useState<EngineSignal[]>([]);
  const [published, setPublished] = useState<SignalRecord[]>([]);
  const [publishThreshold, setPublishThreshold] = useState(80);
  const [scannedAt, setScannedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/signals");
      const json = await res.json();
      if (Array.isArray(json.signals) && json.signals.length > 0) {
        setSignals(json.signals);
        setPublished(Array.isArray(json.published) ? json.published : []);
        if (json.config?.publishThreshold) setPublishThreshold(json.config.publishThreshold);
        setScannedAt(json.scannedAt);
        setError(false);
      } else if (Array.isArray(json.published)) {
        // Tarama boş olsa bile yayın listesini güncelle (arşiv/sil sonrası)
        setPublished(json.published);
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await refresh();
    })();
    const interval = setInterval(() => { if (alive) refresh(); }, 2 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [refresh]);

  return { signals, published, publishThreshold, scannedAt, loading, error, refresh };
}
