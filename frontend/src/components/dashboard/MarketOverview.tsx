"use client";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useBinanceMarket, useFearGreed, useGlobalMarket } from "@/hooks/useMarketData";
import type { TickerData } from "@/lib/api/binance";
import { formatPrice, formatPercent, formatNumber } from "@/lib/utils";
import { Card, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { color, marketColor, mono, insetSurface } from "@/lib/design";

function MoverRow({ coin, index, direction }: { coin: TickerData; index: number; direction: "up" | "down" }) {
  const Arrow = direction === "up" ? TrendingUp : TrendingDown;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${color.divider}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "11px", color: color.faint, width: "14px" }}>{index + 1}</span>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 500, color: color.text }}>{coin.base}</p>
          <p style={{ fontSize: "11px", color: color.muted, ...mono }}>${formatPrice(coin.price)}</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <Arrow size={12} color={marketColor(direction === "up" ? 1 : -1)} />
        <span style={{ fontSize: "12px", fontWeight: 500, ...mono, color: marketColor(coin.change24h) }}>{formatPercent(coin.change24h)}</span>
      </div>
    </div>
  );
}

export function MarketOverviewSection() {
  const { tickers, gainers, losers, loading } = useBinanceMarket();
  const fng = useFearGreed();
  const global = useGlobalMarket();
  const btc = tickers["BTCUSDT"];
  const eth = tickers["ETHUSDT"];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }} className="market-grid">
      <Card>
        <CardTitle>Market Summary</CardTitle>
        {loading ? <Skeleton className="h-32 w-full" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[btc, eth].filter(Boolean).map((coin) => coin && (
              <div key={coin.symbol} style={{ ...insetSurface, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: color.text }}>{coin.base}</p>
                  <p style={{ fontSize: "11px", color: color.muted }}>{coin.name}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "13px", fontWeight: 500, ...mono, color: color.text }}>${formatPrice(coin.price)}</p>
                  <p style={{ fontSize: "11px", ...mono, color: marketColor(coin.change24h) }}>{formatPercent(coin.change24h)}</p>
                </div>
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
              <div style={{ ...insetSurface, padding: "10px 12px" }}>
                <p style={{ fontSize: "10px", color: color.muted }}>BTC Dominans</p>
                <p style={{ fontSize: "14px", fontWeight: 500, ...mono, color: color.text, marginTop: "4px" }}>{global ? `${global.btcDominance}%` : "—"}</p>
              </div>
              <div style={{ ...insetSurface, padding: "10px 12px" }}>
                <p style={{ fontSize: "10px", color: color.muted }}>Total Mcap</p>
                <p style={{ fontSize: "14px", fontWeight: 500, ...mono, color: color.text, marginTop: "4px" }}>{global ? `$${formatNumber(global.totalMarketCap)}` : "—"}</p>
              </div>
            </div>
            <div style={{ ...insetSurface, padding: "12px", textAlign: "center", marginTop: "4px" }}>
              <p style={{ fontSize: "10px", color: color.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Fear & Greed</p>
              <p style={{ fontSize: "22px", fontWeight: 500, ...mono, color: color.text, marginTop: "4px" }}>{fng?.value ?? "—"}</p>
              <p style={{ fontSize: "11px", color: color.textSecondary, marginTop: "2px" }}>{fng?.label ?? "Loading"}</p>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Top Gainers</CardTitle>
        {loading ? <Skeleton className="h-40 w-full" /> : gainers.map((c, i) => <MoverRow key={c.symbol} coin={c} index={i} direction="up" />)}
      </Card>

      <Card>
        <CardTitle>Top Losers</CardTitle>
        {loading ? <Skeleton className="h-40 w-full" /> : losers.map((c, i) => <MoverRow key={c.symbol} coin={c} index={i} direction="down" />)}
      </Card>

      <style>{`@media (max-width: 1100px) { .market-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
