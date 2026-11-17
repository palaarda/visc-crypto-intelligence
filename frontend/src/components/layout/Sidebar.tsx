"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useUIStore, useAuthStore } from "@/lib/store";
import { NAV_ITEMS, SECTION_LABELS } from "@/lib/navigation";
import { color, radius, transition, layout } from "@/lib/design";

const sections = ["operations", "intelligence", "system"] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { logout, user } = useAuthStore();
  const W = sidebarCollapsed ? layout.sidebarCollapsed : layout.sidebarWidth;

  const handleLogout = () => { logout(); router.push("/login"); };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/") ||
    (href === "/markets" && pathname.startsWith("/coin-analysis"));

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100%", zIndex: 40,
      width: W, transition: "width 0.2s ease",
      display: "flex", flexDirection: "column",
      backgroundColor: color.bgSecondary,
      backgroundImage: "linear-gradient(180deg, rgba(123,140,255,0.04) 0%, transparent 28%)",
      borderRight: `1px solid ${color.border}`,
      overflow: "hidden",
    }}>
      <div style={{
        height: layout.navbarHeight, padding: sidebarCollapsed ? "0 16px" : "0 20px",
        display: "flex", alignItems: "center", gap: "12px",
        borderBottom: `1px solid ${color.divider}`, flexShrink: 0,
      }}>
        <div style={{
          width: "30px", height: "30px", borderRadius: radius.md, flexShrink: 0,
          background: "linear-gradient(135deg, rgba(123,140,255,0.25), rgba(91,163,255,0.08))",
          border: `1px solid ${color.accentSoftBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 20px rgba(123,140,255,0.12)",
        }}>
          <span style={{ fontSize: "10px", fontWeight: 650, color: color.accent, letterSpacing: "0.06em" }}>V</span>
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: 550, color: color.text, whiteSpace: "nowrap" }}>VISC</p>
              <p style={{ fontSize: "10px", color: color.muted, marginTop: "2px" }}>Market Intelligence</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav style={{ flex: 1, overflowY: "auto", padding: "14px 10px" }}>
        {sections.map((sec) => {
          const items = NAV_ITEMS.filter((n) => n.section === sec);
          return (
            <div key={sec} style={{ marginBottom: "10px" }}>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ fontSize: "10px", fontWeight: 550, color: color.faint, letterSpacing: "0.12em", textTransform: "uppercase", padding: "10px 10px 6px" }}>
                    {SECTION_LABELS[sec]}
                  </motion.p>
                )}
              </AnimatePresence>
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                    <div style={{
                      position: "relative",
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: sidebarCollapsed ? "10px 0" : "9px 12px",
                      justifyContent: sidebarCollapsed ? "center" : "flex-start",
                      borderRadius: radius.md, marginBottom: "2px",
                      color: active ? color.text : color.muted,
                      backgroundColor: active ? color.accentSoftBg : "transparent",
                      border: active ? `1px solid ${color.accentSoftBorder}` : "1px solid transparent",
                      transition: transition.fast,
                    }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.color = color.textSecondary;
                          e.currentTarget.style.backgroundColor = color.cardHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.color = color.muted;
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      {active && (
                        <div style={{
                          position: "absolute", left: 0, top: "22%", bottom: "22%", width: "2px",
                          background: `linear-gradient(180deg, ${color.accentSoft}, ${color.info})`,
                          borderRadius: "0 2px 2px 0",
                          boxShadow: "0 0 10px rgba(123,140,255,0.45)",
                        }} />
                      )}
                      <Icon size={16} strokeWidth={active ? 2 : 1.75} style={{ flexShrink: 0, color: active ? color.accentSoft : undefined }} />
                      <AnimatePresence>
                        {!sidebarCollapsed && (
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ fontSize: "13px", fontWeight: active ? 550 : 400, whiteSpace: "nowrap" }}>
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </Link>
                );
              })}
              {sec !== "system" && !sidebarCollapsed && (
                <div style={{ height: "1px", background: `linear-gradient(90deg, transparent, ${color.divider}, transparent)`, margin: "10px 10px" }} />
              )}
            </div>
          );
        })}
      </nav>

      <div style={{ borderTop: `1px solid ${color.divider}`, flexShrink: 0 }}>
        <AnimatePresence>
          {!sidebarCollapsed && user && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: "14px 16px", borderBottom: `1px solid ${color.divider}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: radius.sm, flexShrink: 0,
                  background: color.accentSoftBg, border: `1px solid ${color.accentSoftBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 600, color: color.accentSoft,
                }}>
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "12px", fontWeight: 550, color: color.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</p>
                  <p style={{ fontSize: "10px", color: color.muted, textTransform: "capitalize", marginTop: "2px" }}>{user.role}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={handleLogout} style={{
          display: "flex", alignItems: "center", gap: "10px", width: "100%",
          padding: sidebarCollapsed ? "12px 0" : "10px 16px",
          justifyContent: sidebarCollapsed ? "center" : "flex-start",
          border: "none", cursor: "pointer", backgroundColor: "transparent",
          color: color.muted, fontSize: "13px", transition: transition.fast,
        }}
          onMouseEnter={(e) => { e.currentTarget.style.color = color.danger; e.currentTarget.style.backgroundColor = color.dangerBg; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = color.muted; e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          <LogOut size={15} strokeWidth={1.75} />
          {!sidebarCollapsed && <span>Sign Out</span>}
        </button>
        <button onClick={toggleSidebar} style={{
          display: "flex", alignItems: "center", gap: "10px", width: "100%",
          padding: sidebarCollapsed ? "12px 0" : "10px 16px",
          justifyContent: sidebarCollapsed ? "center" : "flex-start",
          border: "none", cursor: "pointer", backgroundColor: "transparent",
          color: color.faint, fontSize: "13px", borderTop: `1px solid ${color.divider}`,
          transition: transition.fast,
        }}
          onMouseEnter={(e) => { e.currentTarget.style.color = color.textSecondary; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = color.faint; }}
        >
          {sidebarCollapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
