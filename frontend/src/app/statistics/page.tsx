"use client";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSignals } from "@/hooks/useSignals";
import { SIGNAL_THRESHOLD } from "@/lib/signal-engine";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { color, mono } from "@/lib/design";

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: color.card, border: `1px solid ${color.border}`, borderRadius: "10px", padding: "8px 12px", fontSize: "12px" }}>
      <p style={{ color: color.muted }}>{label}</p>
      <p style={{ ...mono, color: color.text, fontWeight: 500 }}>Score: {payload[0].value}</p>
    </div>
  );
};

export default function StatisticsPage() {
  const { signals, loading } = useSignals();

  const scan = useMemo(() => {
    const active = signals.filter((s) => s.isSignal);
    const longs = signals.filter((s) => s.direction === "LONG").length;
    const shorts = signals.filter((s) => s.direction === "SHORT").length;
    const trending = signals.filter((s) => s.regime === "TREND").length;
    const avgScore = signals.length ? signals.reduce((a, s) => a + s.score, 0) / signals.length : 0;
    const best = signals[0];
    return { active, longs, shorts, trending, avgScore, best };
  }, [signals]);

  const scoreData = signals.map((s) => ({ name: s.base, score: s.score }));
  const dash = (v: string | number) => (loading ? "—" : v);

  return (
    <DashboardLayout>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }} className="ana-metrics">
        <MetricCard label="Active Signals" value={dash(scan.active.length)} sub={`Threshold ${SIGNAL_THRESHOLD}`} index={0} compact />
        <MetricCard label="Avg. Confidence" value={dash(scan.avgScore.toFixed(0))} sub="Watchlist scan average" index={1} compact />
        <MetricCard label="Trending Markets" value={dash(`${scan.trending}/${signals.length}`)} index={2} compact />
        <MetricCard label="Strongest Setup" value={dash(scan.best?.base ?? "—")} sub={scan.best ? `Score ${scan.best.score}` : ""} index={3} compact />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }} className="ana-charts">
        <Card>
          <CardTitle>Confidence Distribution</CardTitle>
          {loading ? <div style={{ height: "240px", backgroundColor: color.inset, borderRadius: "8px" }} /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={scoreData}>
                <CartesianGrid stroke={color.divider} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: color.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: color.muted, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: color.inset }} />
                <Bar dataKey="score" fill={color.borderStrong} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <CardTitle>Direction Distribution</CardTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "8px 0" }}>
            {[
              { label: "Long", count: scan.longs, total: signals.length },
              { label: "Short", count: scan.shorts, total: signals.length },
              { label: "Neutral", count: signals.length - scan.longs - scan.shorts, total: signals.length },
            ].map((d) => (
              <div key={d.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", color: color.textSecondary }}>{d.label}</span>
                  <span style={{ fontSize: "13px", ...mono, color: color.text }}>{d.count}</span>
                </div>
                <div style={{ height: "3px", backgroundColor: color.divider, borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: d.total ? `${(d.count / d.total) * 100}%` : "0%", backgroundColor: color.borderStrong }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Historical Performance</CardTitle>
        <p style={{ fontSize: "13px", color: color.muted, lineHeight: 1.6 }}>
          Performance data accumulates from published signal snapshots. Win rate, drawdown, and duration analytics will unlock as more trades close.
        </p>
        <div style={{ marginTop: "12px" }}><Badge variant="outline">Accumulating data</Badge></div>
      </Card>

      <style>{`
        @media (max-width: 900px) { .ana-metrics { grid-template-columns: repeat(2, 1fr) !important; } .ana-charts { grid-template-columns: 1fr !important; } }
      `}</style>
    </DashboardLayout>
  );
}
