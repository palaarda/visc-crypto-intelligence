"use client";
import { color, radius } from "@/lib/design";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning" | "info" | "outline";
  size?: "sm" | "md";
}

const variants = {
  default: { bg: color.divider, text: color.textSecondary, border: color.border },
  success: { bg: color.successBg, text: color.success, border: color.successBorder },
  danger:  { bg: color.dangerBg,  text: color.danger,  border: color.dangerBorder },
  warning: { bg: color.warningBg, text: color.warning, border: color.warningBorder },
  info:    { bg: color.infoBg,    text: color.info,    border: color.infoBorder },
  outline: { bg: "transparent",   text: color.textSecondary, border: color.border },
};

export function Badge({ children, variant = "default", size = "sm" }: BadgeProps) {
  const v = variants[variant];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      fontSize: size === "sm" ? "10px" : "11px",
      fontWeight: 500,
      padding: size === "sm" ? "2px 8px" : "4px 10px",
      borderRadius: radius.full,
      backgroundColor: v.bg,
      color: v.text,
      border: `1px solid ${v.border}`,
      letterSpacing: "0.02em",
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}
