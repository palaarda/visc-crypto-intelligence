"use client";
import { Card, CardTitle } from "@/components/ui/Card";
import { color } from "@/lib/design";

interface IntelligenceSectionProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function IntelligenceSection({ title, children, action }: IntelligenceSectionProps) {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <CardTitle>{title}</CardTitle>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function IntelligenceRow({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0", borderBottom: `1px solid ${color.divider}` }}>
      <div>
        <p style={{ fontSize: "12px", color: color.muted }}>{label}</p>
        {detail && <p style={{ fontSize: "11px", color: color.faint, marginTop: "3px" }}>{detail}</p>}
      </div>
      <p style={{ fontSize: "13px", fontWeight: 500, color: color.text, textAlign: "right", maxWidth: "60%" }}>{value}</p>
    </div>
  );
}
