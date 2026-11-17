"use client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/Badge";
import { color } from "@/lib/design";

const NEWS = [
  {
    time: "14:32", source: "Reuters", headline: "Fed officials signal patience on rate cuts amid sticky inflation data",
    importance: "High", impact: "Risk-off", assets: ["BTC", "ETH", "DXY"], confidence: 82, duration: "4-8h", reliability: "A",
  },
  {
    time: "12:15", source: "Bloomberg", headline: "Bitcoin ETF inflows reach $340M on rising institutional demand",
    importance: "Medium", impact: "Crypto bullish", assets: ["BTC"], confidence: 74, duration: "1-3d", reliability: "A",
  },
  {
    time: "09:48", source: "CoinDesk", headline: "Ethereum network upgrade cuts gas fees 12% in first 24 hours",
    importance: "Low", impact: "Neutral", assets: ["ETH"], confidence: 68, duration: "12-24h", reliability: "B",
  },
  {
    time: "08:20", source: "WSJ", headline: "Treasury yields rise as bond market reprices September cut expectations",
    importance: "High", impact: "Risk-off", assets: ["BTC", "SPX", "DXY"], confidence: 79, duration: "2-5d", reliability: "A",
  },
  {
    time: "06:05", source: "FT", headline: "Asian equities mixed; China PMI misses, commodities steady",
    importance: "Medium", impact: "Mixed", assets: ["BNB", "XRP"], confidence: 61, duration: "4-12h", reliability: "B",
  },
];

const impVariant = (i: string) => i === "High" ? "danger" as const : i === "Medium" ? "warning" as const : "outline" as const;

export default function NewsPage() {
  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "1px", backgroundColor: color.divider, borderRadius: "12px", overflow: "hidden", border: `1px solid ${color.border}` }}>
        {NEWS.map((n, i) => (
          <article key={i} style={{ backgroundColor: color.card, padding: "20px 24px" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = color.cardHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = color.card; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", color: color.faint, fontFamily: "var(--font-geist-mono)" }}>{n.time}</span>
              <span style={{ fontSize: "11px", color: color.muted }}>{n.source}</span>
              <Badge variant={impVariant(n.importance)}>{n.importance}</Badge>
              <Badge variant="outline">{n.impact}</Badge>
            </div>
            <h2 style={{ fontSize: "15px", fontWeight: 500, color: color.text, lineHeight: 1.5, marginBottom: "12px" }}>{n.headline}</h2>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "11px", color: color.muted }}>
              <span>Assets: <strong style={{ color: color.textSecondary }}>{n.assets.join(", ")}</strong></span>
              <span>Confidence: <strong style={{ color: color.textSecondary }}>{n.confidence}%</strong></span>
              <span>Duration: <strong style={{ color: color.textSecondary }}>{n.duration}</strong></span>
              <span>Source grade: <strong style={{ color: color.textSecondary }}>{n.reliability}</strong></span>
            </div>
          </article>
        ))}
      </div>
    </DashboardLayout>
  );
}