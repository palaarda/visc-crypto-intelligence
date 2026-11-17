"use client";
import { motion } from "framer-motion";
import { Lock, Clock, ChevronDown, ChevronUp, Archive, Trash2, ArchiveRestore } from "lucide-react";
import { useState } from "react";
import type { SignalRecord } from "@/lib/signal-types";
import { STATUS_LABELS, OPEN_STATUSES } from "@/lib/signal-types";
import { QUALITY_LABELS, HOLDING_LABELS } from "@/lib/signal-engine";
import { Badge } from "@/components/ui/Badge";
import { color, radius, motionPreset, mono, insetSurface, marketColor, transition } from "@/lib/design";
import { formatPrice, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface SignalCardProps {
  record: SignalRecord;
  index?: number;
  onChanged?: () => void;
}

export function SignalCard({ record, index = 0, onChanged }: SignalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const snap = record.snapshot;
  const isOpen = OPEN_STATUSES.includes(record.status);
  const isArchived = !!record.archived;

  const dirVariant = snap.direction === "LONG" ? "success" as const : "danger" as const;
  const statusVariant =
    record.status === "STOPPED" ? "danger" :
    record.status === "EXPIRED" ? "outline" :
    record.status.startsWith("TP") || record.status === "CLOSED" ? "success" :
    record.status === "ACTIVE" ? "info" : "outline";

  const archive = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/signals/${encodeURIComponent(snap.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isArchived ? "unarchive" : "archive" }),
      });
      if (!res.ok) throw new Error();
      toast.success(isArchived ? "Restored from archive" : "Archived — removed from PnL summary");
      onChanged?.();
    } catch {
      toast.error("Action failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (busy) return;
    if (!confirm(`Permanently delete the ${snap.base} ${snap.direction} signal? This cannot be undone and will not affect the PnL summary.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/signals/${encodeURIComponent(snap.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Signal permanently deleted");
      onChanged?.();
    } catch {
      toast.error("Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const actionBtn = (opts: { onClick: () => void; label: string; icon: React.ReactNode; danger?: boolean }) => (
    <button
      type="button"
      disabled={busy}
      onClick={opts.onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        padding: "5px 10px", borderRadius: radius.md, fontSize: "11px",
        cursor: busy ? "wait" : "pointer", opacity: busy ? 0.5 : 1,
        transition: transition.fast,
        backgroundColor: "transparent",
        border: `1px solid ${opts.danger ? color.dangerBorder : color.border}`,
        color: opts.danger ? color.danger : color.textSecondary,
      }}
      onMouseEnter={(e) => {
        if (busy) return;
        e.currentTarget.style.backgroundColor = opts.danger ? color.dangerBg : color.cardHover;
      }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      {opts.icon} {opts.label}
    </button>
  );

  return (
    <motion.div
      {...motionPreset.fadeUp}
      transition={{ ...motionPreset.fadeUp.transition, delay: index * 0.04 }}
      style={{
        backgroundColor: color.card,
        backgroundImage: isOpen && !isArchived
          ? "linear-gradient(145deg, rgba(123,140,255,0.06) 0%, transparent 45%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 40%)",
        border: `1px solid ${isArchived ? color.divider : isOpen ? color.accentSoftBorder : color.border}`,
        borderRadius: radius.xl,
        padding: "24px",
        opacity: isArchived ? 0.72 : 1,
        boxShadow: isArchived ? undefined : "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.28)",
      }}
      className="card-sheen"
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "15px", fontWeight: 500, color: color.text }}>{snap.base}/USDT</span>
            <Badge variant={dirVariant}>{snap.direction}</Badge>
            <Badge variant="outline">{QUALITY_LABELS[snap.quality]} · {snap.confidence}</Badge>
            <Badge variant={statusVariant}>{STATUS_LABELS[record.status]}</Badge>
            {isArchived && <Badge variant="outline">Archive</Badge>}
          </div>
          <p style={{ fontSize: "11px", color: color.muted, display: "flex", alignItems: "center", gap: "4px" }}>
            <Lock size={10} /> Snapshot locked · v{snap.strategyVersion} · {formatDate(snap.generatedAt)}
            {isArchived && " · excluded from PnL summary"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {!isArchived && record.pnl !== null && (
            <span style={{ fontSize: "16px", fontWeight: 500, ...mono, color: marketColor(record.pnl) }}>
              {record.pnl >= 0 ? "+" : ""}{record.pnl.toFixed(2)}%
            </span>
          )}
          {isArchived && (
            <span style={{ fontSize: "11px", color: color.muted }}>PnL excluded</span>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginBottom: "16px" }} className="signal-levels">
        {[
          { label: "Entry", value: snap.entry, hit: !!record.entryTriggeredAt },
          { label: "Stop", value: snap.stopLoss, hit: !!record.stoppedAt },
          { label: "TP1", value: snap.takeProfit[0], hit: !!record.tp1HitAt },
          { label: "TP2", value: snap.takeProfit[1], hit: !!record.tp2HitAt },
          { label: "TP3", value: snap.takeProfit[2], hit: !!record.tp3HitAt },
        ].map((lv) => (
          <div key={lv.label} style={{
            ...insetSurface,
            padding: "10px 12px",
            borderColor: lv.hit ? color.successBorder : color.divider,
            backgroundColor: lv.hit ? color.successBg : color.inset,
          }}>
            <p style={{ fontSize: "10px", color: color.muted, marginBottom: "4px" }}>{lv.label}</p>
            <p style={{ fontSize: "12px", fontWeight: 500, ...mono, color: color.text }}>${formatPrice(lv.value)}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "11px", color: color.muted }}>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Clock size={11} /> {HOLDING_LABELS[snap.holdingType]} · {snap.estimatedDuration}
        </span>
        <span>R:R {snap.riskReward}</span>
        <span>Regime {snap.marketConditions.regime === "TREND" ? "Trend" : "Range"}</span>
        <span>ADX {snap.marketConditions.adx.toFixed(0)}</span>
        {record.status === "WAITING" && !isArchived && <span>Valid until {formatDate(snap.expiresAt)}</span>}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: color.textSecondary, fontSize: "11px", cursor: "pointer" }}
          >
            {expanded ? <>Hide <ChevronUp size={12} /></> : <>Rationale <ChevronDown size={12} /></>}
          </button>
          {actionBtn({
            onClick: archive,
            label: isArchived ? "Unarchive" : "Archive",
            icon: isArchived ? <ArchiveRestore size={12} /> : <Archive size={12} />,
          })}
          {actionBtn({
            onClick: remove,
            label: "Remove",
            icon: <Trash2 size={12} />,
            danger: true,
          })}
        </div>
      </div>

      {expanded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${color.divider}` }}>
          <p style={{ fontSize: "13px", color: color.textSecondary, lineHeight: 1.7, marginBottom: "12px" }}>{snap.signalReason}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }} className="signal-indicators">
            {Object.entries(snap.indicatorValues).map(([k, v]) => (
              <div key={k} style={{ ...insetSurface, padding: "8px 10px" }}>
                <p style={{ fontSize: "9px", color: color.muted }}>{k}</p>
                <p style={{ fontSize: "11px", fontWeight: 500, ...mono, color: color.text }}>{v}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .signal-levels { grid-template-columns: repeat(3, 1fr) !important; }
          .signal-indicators { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </motion.div>
  );
}
