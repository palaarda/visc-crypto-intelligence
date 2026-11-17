"use client";
import { useState } from "react";
import { User, Lock, Bell, Palette } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { useAuthStore } from "@/lib/store";
import { color, radius, transition } from "@/lib/design";
import toast from "react-hot-toast";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [active, setActive] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "" });
  const [notif, setNotif] = useState({ newSignal: true, tpHit: true, slWarning: true, weeklyReport: true });

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast.success("Settings saved");
  };

  return (
    <DashboardLayout>
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "24px" }} className="settings-grid">
        <Card padding="12px">
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button key={s.id} onClick={() => setActive(s.id)} style={{
                display: "flex", alignItems: "center", gap: "10px", width: "100%",
                padding: "10px 12px", borderRadius: radius.md, border: "none", cursor: "pointer",
                backgroundColor: isActive ? color.inset : "transparent",
                color: isActive ? color.text : color.muted,
                fontSize: "13px", fontWeight: isActive ? 500 : 400,
                transition: transition.fast, marginBottom: "2px", textAlign: "left",
              }}>
                <Icon size={15} strokeWidth={1.75} /> {s.label}
              </button>
            );
          })}
        </Card>

        <Card>
          {active === "profile" && (
            <>
              <CardTitle>Profile</CardTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "400px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: color.muted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>Name</label>
                  <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: color.muted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>Email</label>
                  <Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                </div>
                <Button variant="primary" onClick={save} loading={saving}>Save</Button>
              </div>
            </>
          )}
          {active === "notifications" && (
            <>
              <CardTitle>Notifications</CardTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {([
                  ["newSignal", "New signal published"],
                  ["tpHit", "Take profit hit"],
                  ["slWarning", "Stop loss triggered"],
                  ["weeklyReport", "Weekly report"],
                ] as const).map(([key, label]) => (
                  <Toggle key={key} label={label} checked={notif[key]} onChange={(v) => setNotif({ ...notif, [key]: v })} />
                ))}
                <Button variant="primary" onClick={save} loading={saving}>Save</Button>
              </div>
            </>
          )}
          {(active === "security" || active === "appearance") && (
            <>
              <CardTitle>{active === "security" ? "Security" : "Appearance"}</CardTitle>
              <p style={{ fontSize: "13px", color: color.muted }}>This configuration will be available in a future release.</p>
            </>
          )}
        </Card>
      </div>
      <style>{`@media (max-width: 768px) { .settings-grid { grid-template-columns: 1fr !important; } }`}</style>
    </DashboardLayout>
  );
}