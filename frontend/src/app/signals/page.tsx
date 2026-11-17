"use client";
import { useState, useMemo, useEffect } from "react";
import { Filter, Search, SlidersHorizontal, ScrollText, Archive } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSignals } from "@/hooks/useSignals";
import { SignalCard } from "@/components/intelligence/SignalCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { OPEN_STATUSES, type AuditEntry } from "@/lib/signal-types";
import { QUALITY_LABELS } from "@/lib/signal-engine";
import type { EngineSignal } from "@/lib/signal-engine";
import { useAuthStore } from "@/lib/store";
import { color, mono } from "@/lib/design";
import { timeAgo } from "@/lib/utils";

export default function SignalsPage() {
  const { signals, published, publishThreshold, scannedAt, loading, refresh } = useSignals();
  const { user } = useAuthStore();
  const [direction, setDirection] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!auditOpen || !isAdmin) return;
    fetch("/api/signals/audit").then((r) => r.json()).then((j) => setAudit(Array.isArray(j.audit) ? j.audit : [])).catch(() => {});
  }, [auditOpen, isAdmin]);

  // PnL ve operasyon metrikleri yalnızca arşivlenmemiş sinyallerden
  const activePublished = useMemo(() => published.filter((r) => !r.archived), [published]);
  const archivedPublished = useMemo(() => published.filter((r) => !!r.archived), [published]);

  const filtered = useMemo(() => {
    const source = statusFilter === "ARCHIVED" ? archivedPublished : activePublished;
    return source.filter((r) => {
      if (statusFilter === "OPEN" && !OPEN_STATUSES.includes(r.status)) return false;
      if (statusFilter === "CLOSED" && OPEN_STATUSES.includes(r.status)) return false;
      if (direction !== "ALL" && r.snapshot.direction !== direction) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.snapshot.base.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [activePublished, archivedPublished, direction, statusFilter, search]);

  const summary = useMemo(() => {
    const open = activePublished.filter((r) => OPEN_STATUSES.includes(r.status));
    const closed = activePublished.filter((r) => ["CLOSED", "STOPPED"].includes(r.status));
    const wins = closed.filter((r) => (r.pnl ?? 0) > 0).length;
    const totalPnl = closed.reduce((a, r) => a + (r.pnl ?? 0), 0);
    return { open: open.length, closed: closed.length, wins, totalPnl };
  }, [activePublished]);

  const pnlColor = summary.closed === 0 ? color.text : summary.totalPnl >= 0 ? color.success : color.danger;
  const pnlValue = loading ? "—" : summary.closed > 0 ? `${summary.totalPnl >= 0 ? "+" : ""}${summary.totalPnl.toFixed(2)}%` : "—";

  const scanColumns = [
    { key: "asset", header: "Asset", render: (s: EngineSignal) => <span style={{ fontWeight: 500, color: color.text }}>{s.base}</span> },
    { key: "dir", header: "Direction", render: (s: EngineSignal) => s.direction !== "NEUTRAL" ? <Badge variant={s.direction === "LONG" ? "success" : "danger"}>{s.direction}</Badge> : <Badge variant="outline">NEUTRAL</Badge> },
    { key: "score", header: "Score", render: (s: EngineSignal) => <span style={{ ...mono, color: color.text }}>{s.score}</span> },
    { key: "quality", header: "Quality", render: (s: EngineSignal) => <Badge variant="outline">{QUALITY_LABELS[s.quality]}</Badge> },
    { key: "regime", header: "Regime", render: (s: EngineSignal) => <span style={{ fontSize: "12px" }}>{s.regime === "TREND" ? "Trend" : "Range"} · ADX {s.adx.toFixed(0)}</span> },
    { key: "hold", header: "Hold", render: (s: EngineSignal) => <span style={{ fontSize: "12px" }}>{s.holdingType}</span> },
  ];

  return (
    <DashboardLayout>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }} className="sig-metrics">
        <MetricCard label="Open Signals" value={loading ? "—" : summary.open} index={0} compact />
        <MetricCard label="Closed Trades" value={loading ? "—" : summary.closed} index={1} compact />
        <MetricCard label="Win Rate" value={loading ? "—" : summary.closed > 0 ? `${summary.wins}/${summary.closed}` : "—"} index={2} compact />
        <MetricCard label="Total PnL" value={pnlValue} valueColor={loading || summary.closed === 0 ? undefined : pnlColor} index={3} compact />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <p style={{ fontSize: "12px", color: color.muted }}>
          Publish threshold {publishThreshold}/100
          {scannedAt && <> · Last scan {timeAgo(scannedAt)}</>}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setStatusFilter(statusFilter === "ARCHIVED" ? "ALL" : "ARCHIVED")}
            style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px",
              borderRadius: "10px",
              border: `1px solid ${statusFilter === "ARCHIVED" ? color.borderStrong : color.border}`,
              backgroundColor: statusFilter === "ARCHIVED" ? color.card : "transparent",
              color: statusFilter === "ARCHIVED" ? color.text : color.textSecondary,
              fontSize: "12px", cursor: "pointer",
            }}
          >
            <Archive size={14} />
            {statusFilter === "ARCHIVED" ? "Back to active list" : `Archive${archivedPublished.length > 0 ? ` (${archivedPublished.length})` : ""}`}
          </button>
          <button onClick={() => setFiltersOpen(!filtersOpen)} style={{
            display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px",
            borderRadius: "10px", border: `1px solid ${color.border}`, backgroundColor: "transparent",
            color: color.textSecondary, fontSize: "12px", cursor: "pointer",
          }}>
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>
      </div>

      {filtersOpen && (
        <Card style={{ marginBottom: "16px", padding: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }} className="sig-filters">
            <Input icon={<Search size={14} />} placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={direction} onChange={(e) => setDirection(e.target.value)}>
              <option value="ALL">All directions</option>
              <option value="LONG">Long</option>
              <option value="SHORT">Short</option>
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Active list</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="ARCHIVED">Archive</option>
            </Select>
          </div>
        </Card>
      )}

      <p style={{ fontSize: "11px", fontWeight: 500, color: color.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
        {statusFilter === "ARCHIVED" ? "Archive" : "Published Signals"} — {filtered.length}
        {archivedPublished.length > 0 && statusFilter !== "ARCHIVED" && (
          <span style={{ fontWeight: 400, marginLeft: "8px" }}>({archivedPublished.length} archived)</span>
        )}
      </p>

      {loading && published.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<Filter size={20} />} title="No matching signals" description={statusFilter === "ARCHIVED" ? "No signals in the archive." : `The engine only publishes ${publishThreshold}+ confidence setups that pass all filters.`} />
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
          {filtered.map((rec, i) => <SignalCard key={rec.snapshot.id} record={rec} index={i} onChanged={refresh} />)}
        </div>
      )}

      <Card style={{ marginBottom: "24px" }}>
        <CardTitle>Engine Scan — Watchlist View</CardTitle>
        {loading ? <Skeleton className="h-48 w-full" /> : (
          <Table columns={scanColumns} data={signals} keyFn={(s) => s.symbol} />
        )}
      </Card>

      {isAdmin && (
        <Card>
          <button onClick={() => setAuditOpen(!auditOpen)} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
            background: "none", border: "none", cursor: "pointer", padding: 0, color: color.muted,
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <ScrollText size={13} /> Audit Log — Admin
            </span>
          </button>
          {auditOpen && (
            <div style={{ marginTop: "16px", maxHeight: "360px", overflowY: "auto" }}>
              {audit.length === 0 ? <p style={{ fontSize: "12px", color: color.muted, textAlign: "center", padding: "24px" }}>No audit entries yet</p> : audit.map((a, i) => (
                <div key={i} style={{ padding: "12px 0", borderBottom: `1px solid ${color.divider}`, display: "flex", gap: "12px" }}>
                  <Badge variant={a.decision === "PUBLISHED" ? "success" : "danger"}>{a.decision === "PUBLISHED" ? "PUBLISHED" : "REJECTED"}</Badge>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "12px", color: color.text }}>{a.symbol.replace("USDT", "")} · {a.direction} · {a.score}</p>
                    {a.reasons.map((r, ri) => <p key={ri} style={{ fontSize: "11px", color: color.muted, marginTop: "2px" }}>{r}</p>)}
                  </div>
                  <span style={{ fontSize: "10px", color: color.faint }}>{timeAgo(a.time)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <style>{`
        @media (max-width: 900px) { .sig-metrics { grid-template-columns: repeat(2, 1fr) !important; } .sig-filters { grid-template-columns: 1fr !important; } }
      `}</style>
    </DashboardLayout>
  );
}
