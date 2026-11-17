"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { EngineSignal } from "@/lib/signal-engine";
import { SIGNAL_THRESHOLD } from "@/lib/signal-engine";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { color, mono, motionPreset } from "@/lib/design";

interface TopSetupsProps {
  signals: EngineSignal[];
  loading: boolean;
}

export function TopSetups({ signals, loading }: TopSetupsProps) {
  const top = signals.slice(0, 5);

  return (
    <Card style={{ height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <CardTitle>Signal Queue</CardTitle>
        <Link href="/signals" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: color.muted, textDecoration: "none" }}>
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ height: "36px", borderRadius: "6px", backgroundColor: color.inset }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {top.map((s, i) => (
            <motion.div key={s.symbol} {...motionPreset.fadeUp} transition={{ delay: i * 0.04 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: color.text }}>{s.base}</span>
                  {s.direction !== "NEUTRAL" && (
                    <Badge variant={s.direction === "LONG" ? "success" : "danger"}>{s.direction}</Badge>
                  )}
                </div>
                <span style={{ fontSize: "12px", fontWeight: 500, ...mono, color: s.score >= SIGNAL_THRESHOLD ? color.text : color.muted }}>{s.score}</span>
              </div>
              <div style={{ height: "3px", backgroundColor: color.divider, borderRadius: "2px", overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${s.score}%` }} transition={{ delay: 0.2 + i * 0.05, duration: 0.6 }}
                  style={{ height: "100%", backgroundColor: color.borderStrong }} />
              </div>
              <p style={{ fontSize: "10px", color: color.faint, marginTop: "4px" }}>
                {s.regime === "TREND" ? "Trend" : "Range"} · ADX {s.adx.toFixed(0)} · {s.holdingType}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );
}
