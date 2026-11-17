"use client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { IntelligenceSection } from "@/components/intelligence/IntelligenceSection";
import { Badge } from "@/components/ui/Badge";
import { color } from "@/lib/design";

const EVENTS = [
  { date: "Jul 10", time: "15:30", event: "US CPI (YoY)", impact: "High", currency: "USD", forecast: "3.1%", previous: "3.2%" },
  { date: "Jul 11", time: "21:00", event: "FOMC Minutes", impact: "High", currency: "USD", forecast: "—", previous: "—" },
  { date: "Jul 12", time: "12:30", event: "US Initial Jobless Claims", impact: "Medium", currency: "USD", forecast: "238K", previous: "233K" },
  { date: "Jul 15", time: "11:00", event: "EZ Industrial Production", impact: "Low", currency: "EUR", forecast: "0.3%", previous: "-0.1%" },
  { date: "Jul 16", time: "15:30", event: "US Retail Sales (MoM)", impact: "High", currency: "USD", forecast: "0.4%", previous: "0.1%" },
];

const impactVariant = (i: string) => i === "High" ? "danger" as const : i === "Medium" ? "warning" as const : "outline" as const;

export default function MacroEventsPage() {
  return (
    <DashboardLayout>
      <IntelligenceSection title="Economic Calendar">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Date", "Time", "Event", "Impact", "Currency", "Forecast", "Previous"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: color.muted, borderBottom: `1px solid ${color.divider}`, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EVENTS.map((e, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${color.divider}` }}
                  onMouseEnter={(ev) => { ev.currentTarget.style.backgroundColor = color.cardHover; }}
                  onMouseLeave={(ev) => { ev.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: color.textSecondary }}>{e.date}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: color.muted, fontFamily: "var(--font-geist-mono)" }}>{e.time}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 500, color: color.text }}>{e.event}</td>
                  <td style={{ padding: "14px 16px" }}><Badge variant={impactVariant(e.impact)}>{e.impact}</Badge></td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: color.textSecondary }}>{e.currency}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontFamily: "var(--font-geist-mono)", color: color.text }}>{e.forecast}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontFamily: "var(--font-geist-mono)", color: color.muted }}>{e.previous}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </IntelligenceSection>
    </DashboardLayout>
  );
}