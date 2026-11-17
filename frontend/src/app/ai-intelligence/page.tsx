"use client";
import { useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { IntelligenceSection, IntelligenceRow } from "@/components/intelligence/IntelligenceSection";
import { useSignals } from "@/hooks/useSignals";
import { useFearGreed, useGlobalMarket } from "@/hooks/useMarketData";
import { Badge } from "@/components/ui/Badge";
import { color } from "@/lib/design";

export default function AIIntelligencePage() {
  const { signals, published } = useSignals();
  const fng = useFearGreed();
  const global = useGlobalMarket();

  const context = useMemo(() => {
    const live = published.filter((r) => !r.archived);
    const trending = signals.filter((s) => s.regime === "TREND").length;
    const avgScore = signals.length ? Math.round(signals.reduce((a, s) => a + s.score, 0) / signals.length) : 0;
    const btc = signals.find((s) => s.symbol === "BTCUSDT");
    return { trending, avgScore, btc, openSignals: live.length };
  }, [signals, published]);

  return (
    <DashboardLayout>
      <p style={{ fontSize: "13px", color: color.muted, marginBottom: "24px", maxWidth: "640px", lineHeight: 1.7 }}>
        AI provides contextual validation and decision support. It does not generate standalone signals — all outputs supplement the confluence engine.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="ai-grid">
        <IntelligenceSection title="Market Context">
          <IntelligenceRow label="Market Regime" value={context.btc?.regime === "TREND" ? "Trend" : "Range"} detail={`${context.trending}/${signals.length} assets trending`} />
          <IntelligenceRow label="Avg. Confidence" value={`${context.avgScore}/100`} detail="Current scan average" />
          <IntelligenceRow label="Fear & Greed" value={fng ? `${fng.value} — ${fng.label}` : "—"} />
          <IntelligenceRow label="BTC Dominance" value={global ? `${global.btcDominance}%` : "—"} />
        </IntelligenceSection>

        <IntelligenceSection title="AI Validation">
          <IntelligenceRow label="Module Status" value="Pending — Phase 4" detail="OpenRouter integration" />
          <IntelligenceRow label="Validation Role" value="Confirm / veto only" detail="Not a standalone signal source" />
          <IntelligenceRow label="Open Signals" value={String(context.openSignals)} detail="Published locked snapshots" />
          <div style={{ marginTop: "12px" }}><Badge variant="outline">AI Score: Inactive</Badge></div>
        </IntelligenceSection>

        <IntelligenceSection title="Risk Analysis">
          <IntelligenceRow label="Avg. Volatility" value={signals.length ? `${(signals.reduce((a, s) => a + s.atrPct, 0) / signals.length).toFixed(2)}%` : "—"} detail="ATR / Price (1h)" />
          <IntelligenceRow label="Risk Distribution" value={`${signals.filter((s) => s.risk === "LOW").length}L · ${signals.filter((s) => s.risk === "MEDIUM").length}M · ${signals.filter((s) => s.risk === "HIGH").length}H`} />
        </IntelligenceSection>

        <IntelligenceSection title="Event Detection">
          <IntelligenceRow label="Whale Activity" value="Monitoring" detail="On-chain data — Phase 5" />
          <IntelligenceRow label="News Impact" value="Low" detail="No high-impact events detected" />
          <IntelligenceRow label="Macro Calendar" value="See Macro Events" detail="Economic releases tracked separately" />
        </IntelligenceSection>
      </div>

      <style>{`@media (max-width: 900px) { .ai-grid { grid-template-columns: 1fr !important; } }`}</style>
    </DashboardLayout>
  );
}