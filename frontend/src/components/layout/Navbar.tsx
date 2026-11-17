"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, ChevronDown, CheckCheck, X } from "lucide-react";
import { useAuthStore, useNotificationStore, useUIStore } from "@/lib/store";
import { resolvePageTitle } from "@/lib/navigation";
import { timeAgo } from "@/lib/utils";
import { color, radius, layout, motionPreset } from "@/lib/design";

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { notifications, unreadCount, markAllRead } = useNotificationStore();
  const { sidebarCollapsed } = useUIStore();
  const page = resolvePageTitle(pathname);

  const [time, setTime] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const closeAll = () => { setNotifOpen(false); setProfileOpen(false); };
  const sidebarW = sidebarCollapsed ? layout.sidebarCollapsed : layout.sidebarWidth;

  return (
    <header style={{
      position: "fixed", top: 0, right: 0, height: layout.navbarHeight, zIndex: 30,
      left: sidebarW, transition: "left 0.2s ease",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px",
      backgroundColor: "rgba(8,9,11,0.72)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: `1px solid ${color.divider}`,
    }}>
      {/* Page title */}
      <div>
        <p style={{ fontSize: "15px", fontWeight: 550, color: color.text, letterSpacing: "-0.02em" }}>{page.title}</p>
        {page.subtitle && <p style={{ fontSize: "11px", color: color.muted, marginTop: "2px" }}>{page.subtitle}</p>}
      </div>

      {/* Right controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Market status */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 11px", borderRadius: radius.full, border: `1px solid ${color.successBorder}`, backgroundColor: color.successBg, marginRight: "4px" }} className="hidden sm:flex">
          <div className="pulse-live" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: color.success, boxShadow: `0 0 8px ${color.success}` }} />
          <span style={{ fontSize: "11px", fontWeight: 550, color: color.success }}>Live</span>
        </div>

        {/* Time */}
        <span style={{ fontSize: "12px", color: color.muted, fontFamily: "var(--font-geist-mono)", marginRight: "4px" }} className="hidden md:block">{time}</span>

        {/* Search */}
        <AnimatePresence mode="wait">
          {searchOpen ? (
            <motion.div key="s" {...motionPreset.dropdown} style={{ display: "flex", alignItems: "center", border: `1px solid ${color.border}`, borderRadius: radius.md, backgroundColor: color.card, overflow: "hidden" }}>
              <Search size={14} color={color.muted} style={{ marginLeft: "10px" }} />
              <input autoFocus placeholder="Search..." style={{ background: "transparent", border: "none", outline: "none", color: color.text, fontSize: "13px", padding: "7px 10px", width: "200px" }} />
              <button onClick={() => setSearchOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 10px", color: color.muted }}><X size={14} /></button>
            </motion.div>
          ) : (
            <button onClick={() => setSearchOpen(true)} style={{
              width: "32px", height: "32px", borderRadius: radius.md,
              border: `1px solid ${color.border}`, backgroundColor: "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: color.muted, transition: "color 0.15s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = color.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = color.muted; }}
            >
              <Search size={15} strokeWidth={1.75} />
            </button>
          )}
        </AnimatePresence>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }} style={{
            width: "32px", height: "32px", borderRadius: radius.md,
            border: `1px solid ${color.border}`, backgroundColor: "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: color.muted, position: "relative",
          }}>
            <Bell size={15} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span style={{ position: "absolute", top: "-4px", right: "-4px", width: "14px", height: "14px", borderRadius: "50%", backgroundColor: color.danger, color: "#fff", fontSize: "8px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div {...motionPreset.dropdown} style={{
                position: "absolute", right: 0, top: "40px", width: "320px",
                backgroundColor: color.card, border: `1px solid ${color.border}`,
                borderRadius: radius.lg, overflow: "hidden", zIndex: 50,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${color.divider}` }}>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: color.text }}>Notifications</span>
                  <button onClick={markAllRead} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: color.muted }}>
                    <CheckCheck size={12} /> Mark all read
                  </button>
                </div>
                <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <p style={{ padding: "24px", textAlign: "center", fontSize: "12px", color: color.muted }}>No notifications</p>
                  ) : notifications.map((n) => (
                    <div key={n.id} style={{ padding: "12px 16px", borderBottom: `1px solid ${color.divider}`, backgroundColor: !n.isRead ? color.inset : "transparent" }}>
                      <p style={{ fontSize: "12px", fontWeight: 500, color: color.text }}>{n.title}</p>
                      <p style={{ fontSize: "11px", color: color.muted, marginTop: "3px", lineHeight: 1.5 }}>{n.message}</p>
                      <p style={{ fontSize: "10px", color: color.faint, marginTop: "4px" }}>{timeAgo(n.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div style={{ position: "relative" }}>
          <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }} style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "4px 10px 4px 4px", borderRadius: radius.md,
            border: `1px solid ${color.border}`, backgroundColor: "transparent", cursor: "pointer",
          }}>
            <div style={{ width: "24px", height: "24px", borderRadius: radius.sm, backgroundColor: color.inset, border: `1px solid ${color.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 500, color: color.textSecondary }}>
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <ChevronDown size={12} color={color.muted} className="hidden sm:block" />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div {...motionPreset.dropdown} style={{
                position: "absolute", right: 0, top: "40px", width: "200px",
                backgroundColor: color.card, border: `1px solid ${color.border}`,
                borderRadius: radius.lg, overflow: "hidden", zIndex: 50,
              }}>
                <div style={{ padding: "12px 14px", borderBottom: `1px solid ${color.divider}` }}>
                  <p style={{ fontSize: "12px", fontWeight: 500, color: color.text }}>{user?.name}</p>
                  <p style={{ fontSize: "10px", color: color.muted, marginTop: "2px" }}>{user?.email}</p>
                </div>
                <a href="/settings" style={{ display: "block", padding: "10px 14px", fontSize: "13px", color: color.textSecondary, textDecoration: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = color.cardHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >Settings</a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {(notifOpen || profileOpen) && <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={closeAll} />}
    </header>
  );
}
