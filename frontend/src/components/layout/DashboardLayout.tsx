"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useAuthStore, useUIStore, useNotificationStore } from "@/lib/store";
import type { SignalRecord } from "@/lib/signal-types";
import type { Notification } from "@/types";
import { layout } from "@/lib/design";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();
  const { setNotifications } = useNotificationStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  useEffect(() => {
    let alive = true;
    fetch("/api/signals")
      .then((r) => r.json())
      .then((json) => {
        if (!alive || !Array.isArray(json.published)) return;
        const records: SignalRecord[] = json.published.filter((r: SignalRecord) => !r.archived).slice(0, 10);
        const notifications: Notification[] = records.map((rec) => {
          const s = rec.snapshot;
          const statusNote =
            rec.status === "WAITING" ? "published" :
            rec.status === "ACTIVE" ? "active" :
            rec.status === "STOPPED" ? "stopped out" :
            rec.status === "CLOSED" ? "closed" :
            rec.status === "EXPIRED" ? "expired" : rec.status.replace("_HIT", " hit");
          return {
            id: s.id,
            title: `${s.base} ${s.direction} — ${statusNote}`,
            message: `Score ${s.confidence}/100 · Entry $${s.entry.toLocaleString("en-US", { maximumFractionDigits: 2 })} · ${s.estimatedDuration}`,
            type: rec.status === "STOPPED" ? "danger" : rec.status === "CLOSED" ? "success" : s.direction === "LONG" ? "success" : "warning",
            isRead: false,
            createdAt: s.generatedAt,
          };
        });
        if (notifications.length === 0) {
          notifications.push({
            id: "engine-idle",
            title: "Signal engine active",
            message: "No setups above the publish threshold — scanning markets.",
            type: "info",
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
        setNotifications(notifications);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [setNotifications]);

  if (!isAuthenticated) return null;

  const sidebarW = sidebarCollapsed ? layout.sidebarCollapsed : layout.sidebarWidth;

  return (
    <div className="app-shell">
      <Sidebar />
      <Navbar />
      <main style={{
        marginLeft: sidebarW,
        paddingTop: layout.navbarHeight,
        minHeight: "100vh",
        transition: "margin-left 0.2s ease",
      }}>
        <div style={{ padding: "32px 32px 72px", width: "100%", boxSizing: "border-box" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
