"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Activity, Layers, Zap, BarChart, Percent, ShieldCheck, Droplets, Database, Brain, Waves } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ENGINE_MODULES, ADX_TREND_MIN } from "@/lib/signal-engine";
import { useSignals } from "@/hooks/useSignals";
import { useAuthStore } from "@/lib/store";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { Select } from "@/components/ui/Select";
import { color, mono, motionPreset, insetSurface } from "@/lib/design";
import toast from "react-hot-toast";

const iconMap: Record<string, React.ElementType> = {
  TrendingUp, Activity, Layers, Zap, BarChart, Percent, Droplets, Database, Brain, Waves, ShieldCheck,
};

export default function StrategiesPage() {
  const { signals, publishThreshold, loading } = useSignals();
  const { user } = useAuthStore();
  const [savingThreshold, setSavingThreshold] = useState(false);
  const isAdmin = user?.role === "admin";

  const updateThreshold = async (value: number) => {
    setSavingThreshold(true);
    try {
      const res = await fetch("/api/signal-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publishThreshold: value }) });
      if (res.ok) toast.success(`Threshold set to ${value}`);
      else toast.error("Update failed");
    } catch { toast.error("Update failed"); }
    finally { setSavingThreshold(false); }
  };

  const moduleHitRate = (moduleId: string) => {
    if (!signals.length) return null;
    let earned = 0, total = 0;
    for (const s of signals) {
      for (const c of s.components) {
        if (c.module === moduleId) { total++; if (c.earned) earned++; }
      }
    }
    return total === 0 ? null : Math.round((earned / total) * 100);
  };

  const scoring = ENGINE_MODULES.filter((m) => m.weight > 0);
  const gates = ENGINE_MODULES.filter((m) => m.weight === 0);

  return (
    <DashboardLayout>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }} className="strat-metrics">
        <MetricCard label="Publish Threshold" value={`${publishThreshold}/100`} sub={isAdmin ? "Adjustable by admin" : "Default"} index={0} compact />
        <MetricCard label="Regime Gate" value={`ADX ≥ ${ADX_TREND_MIN}`} sub="Trend / range filter" index={1} compact />
        <MetricCard label="Active Modules" value={`${ENGINE_MODULES.length}`} sub="Scoring + gates" index={2} compact />
      </div>

      {isAdmin && (
        <Card style={{ marginBottom: "24px", padding: "16px", maxWidth: "240px" }}>
          <Select label="Publish Threshold" value={publishThreshold} disabled={savingThreshold} onChange={(e) => updateThreshold(Number(e.target.value))}>
            {[70, 75, 80, 85, 90].map((v) => <option key={v} value={v}>{v}/100</option>)}
          </Select>
        </Card>
      )}

      <Card style={{ marginBottom: "24px" }}>
        <CardTitle>Confluence Sistemi v2</CardTitle>
        <p style={{ fontSize: "13px", color: color.textSecondary, lineHeight: 1.7 }}>
          Nine scoring modules produce a 0–100 confidence score. Setups above {publishThreshold} in a trending regime are published as immutable snapshots after passing volume, cooldown, and volatility filters. Quality tiers: 70–79 Normal, 80–89 High, 90+ Premium.
        </p>
      </Card>

      <p style={{ fontSize: "11px", fontWeight: 500, color: color.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Scoring Modules</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }} className="strat-grid">
        {scoring.map((m, i) => {
          const Icon = iconMap[m.icon] || Activity;
          const hitRate = moduleHitRate(m.id);
          return (
            <motion.div key={m.id} {...motionPreset.fadeUp} transition={{ delay: i * 0.03 }}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div style={{ ...insetSurface, width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} color={color.muted} strokeWidth={1.75} />
                  </div>
                  <Badge variant="outline">{m.weight} pts</Badge>
                </div>
                <h3 style={{ fontSize: "14px", fontWeight: 500, color: color.text, marginBottom: "6px" }}>{m.name}</h3>
                <p style={{ fontSize: "12px", color: color.muted, lineHeight: 1.6, marginBottom: "12px" }}>{m.description}</p>
                <Badge variant="outline">{m.type}</Badge>
                <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: `1px solid ${color.divider}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "10px", color: color.muted }}>Hit rate</span>
                    <span style={{ fontSize: "11px", ...mono, color: color.textSecondary }}>{hitRate === null ? "—" : `${hitRate}%`}</span>
                  </div>
                  <div style={{ height: "3px", backgroundColor: color.divider, borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: hitRate ? `${hitRate}%` : "0%", backgroundColor: color.borderStrong }} />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <p style={{ fontSize: "11px", fontWeight: 500, color: color.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Gate & Risk Modules</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="gate-grid">
        {gates.map((m) => {
          const Icon = iconMap[m.icon] || Activity;
          return (
            <Card key={m.id}>
              <div style={{ display: "flex", gap: "14px" }}>
                <div style={{ ...insetSurface, width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={16} color={color.muted} strokeWidth={1.75} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 500, color: color.text }}>{m.name}</h3>
                    <Badge variant="info">Gate</Badge>
                  </div>
                  <p style={{ fontSize: "12px", color: color.muted, lineHeight: 1.6 }}>{m.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 1100px) { .strat-grid { grid-template-columns: repeat(2, 1fr) !important; } .strat-metrics { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { .strat-grid, .gate-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </DashboardLayout>
  );
}
