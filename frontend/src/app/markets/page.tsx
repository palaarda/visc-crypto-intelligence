"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useBinanceMarket } from "@/hooks/useMarketData";
import { useSignals } from "@/hooks/useSignals";
import { WATCHLIST, coinName } from "@/lib/api/binance";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { color, marketColor, mono } from "@/lib/design";
import { formatPrice, formatPercent } from "@/lib/utils";

export default function MarketsPage() {
  const router = useRouter();
  const { tickers, loading } = useBinanceMarket();
  const { signals } = useSignals();
  const [search, setSearch] = useState("");

  const assets = useMemo(() => {
    return WATCHLIST.map((symbol) => {
      const base = symbol.replace("USDT", "");
      const ticker = tickers[symbol];
      const scan = signals.find((s) => s.symbol === symbol);
      return { symbol, base, name: coinName(base), ticker, scan };
    }).filter((a) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return a.base.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
    });
  }, [tickers, signals, search]);

  const columns = [
    { key: "asset", header: "Asset", render: (a: typeof assets[0]) => (
      <div>
        <p style={{ fontWeight: 500, color: color.text }}>{a.base}</p>
        <p style={{ fontSize: "11px", color: color.muted }}>{a.name}</p>
      </div>
    )},
    { key: "price", header: "Price", render: (a: typeof assets[0]) => (
      <span style={{ ...mono, color: color.text }}>{a.ticker ? `$${formatPrice(a.ticker.price)}` : "—"}</span>
    )},
    { key: "change", header: "24h", render: (a: typeof assets[0]) => a.ticker ? (
      <span style={{ ...mono, color: marketColor(a.ticker.change24h) }}>{formatPercent(a.ticker.change24h)}</span>
    ) : "—" },
    { key: "regime", header: "Regime", render: (a: typeof assets[0]) => a.scan ? (
      <Badge variant="outline">{a.scan.regime === "TREND" ? "Trend" : "Range"} · ADX {a.scan.adx.toFixed(0)}</Badge>
    ) : <span style={{ color: color.faint }}>—</span> },
    { key: "score", header: "Confidence", render: (a: typeof assets[0]) => a.scan ? (
      <span style={{ ...mono }}>{a.scan.score}</span>
    ) : "—" },
    { key: "dir", header: "Bias", render: (a: typeof assets[0]) => a.scan && a.scan.direction !== "NEUTRAL" ? (
      <Badge variant={a.scan.direction === "LONG" ? "success" : "danger"}>{a.scan.direction}</Badge>
    ) : <Badge variant="outline">NEUTRAL</Badge> },
  ];

  return (
    <DashboardLayout>
      <Card style={{ marginBottom: "16px", padding: "16px" }}>
        <Input icon={<Search size={14} />} placeholder="Search markets..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      <Card>
        <CardTitle>Watchlist — {assets.length} assets</CardTitle>
        {loading ? <Skeleton className="h-64 w-full" /> : (
          <Table
            columns={columns}
            data={assets}
            keyFn={(a) => a.symbol}
            onRowClick={(a) => router.push(`/coin-analysis?symbol=${a.symbol}`)}
          />
        )}
      </Card>
    </DashboardLayout>
  );
}
