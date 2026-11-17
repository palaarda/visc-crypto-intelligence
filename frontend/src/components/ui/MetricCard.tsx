"use client";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { color, radius, motionPreset, mono, marketColor, shadow, transition } from "@/lib/design";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  delta?: number;
  valueColor?: string;
  icon?: LucideIcon;
  index?: number;
  compact?: boolean;
}

export function MetricCard({ label, value, sub, delta, valueColor, icon: Icon, index = 0, compact }: MetricCardProps) {
  return (
    <motion.div
      {...motionPreset.fadeUp}
      transition={{ ...motionPreset.fadeUp.transition, delay: index * 0.045 }}
      className="card-sheen"
      style={{
        backgroundColor: color.card,
        backgroundImage: "linear-gradient(145deg, rgba(123,140,255,0.05) 0%, transparent 42%)",
        border: `1px solid ${color.border}`,
        borderRadius: radius.xl,
        padding: compact ? "16px 18px" : "20px",
        boxShadow: shadow.card,
        transition: transition.base,
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color.borderStrong;
        e.currentTarget.style.boxShadow = shadow.cardHover;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = color.border;
        e.currentTarget.style.boxShadow = shadow.card;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: compact ? "12px" : "16px" }}>
        <p style={{ fontSize: "11px", fontWeight: 500, color: color.muted, textTransform: "uppercase", letterSpacing: "0.09em" }}>{label}</p>
        {Icon && (
          <div style={{
            width: "30px", height: "30px", borderRadius: radius.md,
            backgroundColor: color.accentSoftBg,
            border: `1px solid ${color.accentSoftBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={14} color={color.accentSoft} strokeWidth={1.75} />
          </div>
        )}
      </div>
      <p style={{ fontSize: compact ? "22px" : "26px", fontWeight: 550, color: valueColor ?? color.text, ...mono, lineHeight: 1, letterSpacing: "-0.03em" }}>{value}</p>
      {(sub || delta !== undefined) && (
        <p style={{ fontSize: "12px", marginTop: "10px", color: delta !== undefined ? marketColor(delta) : color.muted, lineHeight: 1.4 }}>
          {delta !== undefined && `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}% `}
          {sub}
        </p>
      )}
    </motion.div>
  );
}
