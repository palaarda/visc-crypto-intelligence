"use client";
import { color, radius } from "@/lib/design";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", className)} style={{ padding: "48px 24px" }}>
      <div style={{
        width: "48px", height: "48px", borderRadius: radius.lg,
        backgroundColor: color.inset, border: `1px solid ${color.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: color.muted, marginBottom: "16px",
      }}>
        {icon}
      </div>
      <p style={{ fontSize: "14px", fontWeight: 500, color: color.text, marginBottom: "6px" }}>{title}</p>
      <p style={{ fontSize: "13px", color: color.muted, maxWidth: "360px", lineHeight: 1.6 }}>{description}</p>
      {action && <div style={{ marginTop: "20px" }}>{action}</div>}
    </div>
  );
}
