"use client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Wallet } from "lucide-react";

export default function PortfolioPage() {
  return (
    <DashboardLayout>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }} className="port-metrics">
        <MetricCard label="Total Value" value="—" sub="Connect exchange" index={0} compact />
        <MetricCard label="Open Positions" value="0" sub="No active positions" index={1} compact />
        <MetricCard label="Unrealized PnL" value="—" index={2} compact />
        <MetricCard label="Exposure" value="—" sub="Risk distribution" index={3} compact />
      </div>

      <Card>
        <EmptyState
          icon={<Wallet size={20} />}
          title="Portfolio tracking"
          description="Position and exposure tracking will be available once exchange integration is configured. Published signal snapshots remain the primary reference for trade execution."
        />
      </Card>

      <style>{`@media (max-width: 900px) { .port-metrics { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
    </DashboardLayout>
  );
}