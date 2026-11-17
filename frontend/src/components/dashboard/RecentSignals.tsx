"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { STATUS_LABELS } from "@/lib/signal-types";
import { QUALITY_LABELS, HOLDING_LABELS } from "@/lib/signal-engine";
import type { SignalRecord } from "@/lib/signal-types";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, TableRowSkeleton } from "@/components/ui/Skeleton";
import { color, mono, marketColor } from "@/lib/design";
import { formatPrice, timeAgo } from "@/lib/utils";
import { Zap } from "lucide-react";

interface RecentSignalsProps {
  published: SignalRecord[];
  loading: boolean;
}

export function RecentSignals({ published, loading }: RecentSignalsProps) {
  const recent = published.slice(0, 6);

  const columns = [
    {
      key: "asset", header: "Asset",
      render: (r: SignalRecord) => <span style={{ fontWeight: 500, color: color.text }}>{r.snapshot.base}</span>,
    },
    {
      key: "dir", header: "Direction",
      render: (r: SignalRecord) => <Badge variant={r.snapshot.direction === "LONG" ? "success" : "danger"}>{r.snapshot.direction}</Badge>,
    },
    {
      key: "conf", header: "Confidence",
      render: (r: SignalRecord) => <span style={{ ...mono, color: color.text }}>{r.snapshot.confidence} · {QUALITY_LABELS[r.snapshot.quality]}</span>,
    },
    {
      key: "entry", header: "Entry",
      render: (r: SignalRecord) => <span style={{ ...mono }}>${formatPrice(r.snapshot.entry)}</span>,
    },
    {
      key: "hold", header: "Hold",
      render: (r: SignalRecord) => <span style={{ fontSize: "12px" }}>{HOLDING_LABELS[r.snapshot.holdingType]}</span>,
    },
    {
      key: "pnl", header: "PnL",
      render: (r: SignalRecord) => r.pnl !== null
        ? <span style={{ ...mono, color: marketColor(r.pnl) }}>{r.pnl >= 0 ? "+" : ""}{r.pnl.toFixed(2)}%</span>
        : <span style={{ color: color.faint }}>—</span>,
    },
    {
      key: "status", header: "Status",
      render: (r: SignalRecord) => <Badge variant="outline">{STATUS_LABELS[r.status]}</Badge>,
    },
    {
      key: "time", header: "Time",
      render: (r: SignalRecord) => <span style={{ fontSize: "12px", color: color.muted }}>{timeAgo(r.snapshot.generatedAt)}</span>,
    },
  ];

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <CardTitle>Active Signals</CardTitle>
        <Link href="/signals" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: color.muted, textDecoration: "none" }}>
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {loading && recent.length === 0 ? (
        <table style={{ width: "100%" }}><tbody>{Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={8} />)}</tbody></table>
      ) : (
        <Table
          columns={columns}
          data={recent}
          keyFn={(r) => r.snapshot.id}
          empty={
            <EmptyState
              icon={<Zap size={20} />}
              title="No published signals"
              description="The engine only publishes high-confidence setups above the publish threshold."
            />
          }
        />
      )}
    </Card>
  );
}
