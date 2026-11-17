"use client";
import { useEffect, useState } from "react";
import {
  WATCHLIST,
  type TickerData,
  fetchAllTickers,
  extractWatchlist,
  extractMovers,
  openTickerStream,
} from "@/lib/api/binance";

/**
 * Binance canlı market verisi.
 * - REST: ilk yükleme + 60 sn'de bir tam liste (gainers/losers)
 * - WebSocket: izleme listesi için anlık fiyat güncellemesi
 */
export function useBinanceMarket() {
  const [tickers, setTickers] = useState<Record<string, TickerData>>({});
  const [gainers, setGainers] = useState<TickerData[]>([]);
  const [losers, setLosers] = useState<TickerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const all = await fetchAllTickers();
        if (!alive) return;
        setTickers((prev) => {
          const fresh = extractWatchlist(all);
          // WS'den gelen daha güncel fiyatları REST ezmesin
          for (const sym of Object.keys(fresh)) {
            if (prev[sym]) fresh[sym] = { ...fresh[sym], price: prev[sym].price || fresh[sym].price };
          }
          return fresh;
        });
        const movers = extractMovers(all);
        setGainers(movers.gainers);
        setLosers(movers.losers);
        setLoading(false);
        setError(false);
      } catch {
        if (alive) setError(true);
      }
    }

    load();
    const interval = setInterval(load, 60_000);

    const closeStream = openTickerStream(WATCHLIST, (update) => {
      setTickers((prev) => {
        const existing = prev[update.symbol];
        if (!existing) return prev;
        return { ...prev, [update.symbol]: { ...existing, ...update } };
      });
    });

    return () => {
      alive = false;
      clearInterval(interval);
      closeStream();
    };
  }, []);

  return { tickers, gainers, losers, loading, error };
}

export function useFearGreed() {
  const [data, setData] = useState<{ value: number; label: string } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/fng")
      .then((r) => r.json())
      .then((j) => {
        if (alive && typeof j.value === "number") setData(j);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return data;
}

export function useGlobalMarket() {
  const [data, setData] = useState<{ btcDominance: number; totalMarketCap: number } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/global")
      .then((r) => r.json())
      .then((j) => {
        if (alive && typeof j.btcDominance === "number") setData(j);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return data;
}
