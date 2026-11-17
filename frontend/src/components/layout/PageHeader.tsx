"use client";
import { color } from "@/lib/design";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 500, color: color.text, letterSpacing: "-0.02em" }}>{title}</h1>
        {subtitle && <p style={{ fontSize: "13px", color: color.muted, marginTop: "6px" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
