"use client";
import { useMemo } from "react";
import { Zap, TrendingUp, Percent, Activity, Bitcoin, PieChart, Gauge, Waves } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/ui/MetricCard";
import { MarketOverviewSection } from "@/components/dashboard/MarketOverview";
import { RecentSignals } from "@/components/dashboard/RecentSignals";
import { TopSetups } from "@/components/dashboard/TopSetups";
import { useSignals } from "@/hooks/useSignals";
import { OPEN_STATUSES } from "@/lib/signal-types";
import { useBinanceMarket, useFearGreed, useGlobalMarket } from "@/hooks/useMarketData";
import { WATCHLIST } from "@/lib/api/binance";
import { formatPrice } from "@/lib/utils";

export default function DashboardPage() {
  const { signals, published, loading: signalsLoading } = useSignals();
  const { tickers } = useBinanceMarket();
  const fng = useFearGreed();
  const global = useGlobalMarket();

  const btc = tickers["BTCUSDT"];
  const btcScan = signals.find((s) => s.symbol === "BTCUSDT");

  const stats = useMemo(() => {
    const live = published.filter((r) => !r.archived);
    const open = live.filter((r) => OPEN_STATUSES.includes(r.status));
    const longs = open.filter((r) => r.snapshot.direction === "LONG").length;
    const shorts = open.filter((r) => r.snapshot.direction === "SHORT").length;
    const avgScore = signals.length ? Math.round(signals.reduce((a, s) => a + s.score, 0) / signals.length) : 0;
    const trending = signals.filter((s) => s.regime === "TREND").length;
    return { open: open.length, longs, shorts, avgScore, trending, publishedCount: live.length };
  }, [signals, published]);

  const dash = (v: string | number | undefined | null) => (v === undefined || v === null ? "—" : v);

  const metrics = [
    { label: "Open Signals", value: signalsLoading ? "—" : stats.open, sub: `${stats.publishedCount} total published`, icon: Zap },
    { label: "Avg. Confidence", value: signalsLoading ? "—" : stats.avgScore, sub: "Confluence score", icon: Percent },
    { label: "Long / Short", value: signalsLoading ? "—" : `${stats.longs} / ${stats.shorts}`, sub: "Active direction mix", icon: TrendingUp },
    { label: "Watched Assets", value: WATCHLIST.length, sub: "Multi-timeframe scan", icon: Activity },
    { label: "BTC Price", value: btc ? `$${formatPrice(btc.price)}` : "—", delta: btc?.change24h, sub: "24h change", icon: Bitcoin },
    { label: "BTC Dominance", value: global ? `${global.btcDominance}%` : "—", sub: "CoinGecko live", icon: PieChart },
    { label: "Fear & Greed", value: dash(fng?.value), sub: fng?.label ?? "Loading", icon: Gauge },
    { label: "Market Regime", value: signalsLoading ? "—" : btcScan?.regime === "TREND" ? "Trend" : "Range", sub: btcScan ? `ADX ${btcScan.adx.toFixed(0)} · ${stats.trending}/${signals.length} trending` : "", icon: Waves },
  ];

  return (
    <DashboardLayout>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }} className="dash-metrics">
        {metrics.map((m, i) => <MetricCard key={m.label} {...m} index={i} compact />)}
      </div>

      <div style={{ marginBottom: "24px" }}>
        <MarketOverviewSection />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px" }} className="dash-signals">
        <RecentSignals published={published.filter((r) => !r.archived)} loading={signalsLoading} />
        <TopSetups signals={signals} loading={signalsLoading} />
      </div>

      <style>{`
        @media (max-width: 1280px) { .dash-metrics { grid-template-columns: repeat(2, 1fr) !important; } .dash-signals { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { .dash-metrics { grid-template-columns: 1fr !important; } }
      `}</style>
    </DashboardLayout>
  );
}
