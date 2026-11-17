"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { color, radius, motionPreset } from "@/lib/design";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "At least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    login(
      {
        id: form.email === "admin@visc.com" || form.email === "admin@sahaops.com" ? "1" : "2",
        email: form.email,
        name: form.email === "admin@visc.com" || form.email === "admin@sahaops.com" ? "Admin User" : form.email.split("@")[0],
        role: form.email === "admin@visc.com" || form.email === "admin@sahaops.com" ? "admin" : "trader",
        createdAt: new Date().toISOString(),
      },
      "mock-jwt-token"
    );
    toast.success("Signed in successfully");
    router.push("/dashboard");
    setLoading(false);
  };

  return (
    <div className="app-shell login-shell" style={{ minHeight: "100vh", display: "flex", position: "relative", overflow: "hidden" }}>
      {/* Ambient glow — login only, more present but still restrained */}
      <div aria-hidden className="login-glow-layer" style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: [
          "radial-gradient(ellipse 90% 70% at 18% 35%, rgba(123,140,255,0.18), transparent 58%)",
          "radial-gradient(ellipse 55% 45% at 42% 70%, rgba(91,163,255,0.10), transparent 55%)",
          "radial-gradient(ellipse 40% 35% at 8% 85%, rgba(123,140,255,0.08), transparent 50%)",
          "radial-gradient(ellipse 50% 40% at 88% 20%, rgba(123,140,255,0.06), transparent 55%)",
        ].join(", "),
      }} />
      <div aria-hidden className="login-glow-pulse" style={{
        position: "absolute", left: "-8%", top: "18%", width: "52%", height: "64%",
        pointerEvents: "none", zIndex: 0, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(123,140,255,0.14) 0%, transparent 68%)",
        filter: "blur(40px)",
      }} />
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.35,
        backgroundImage: "linear-gradient(rgba(123,140,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(123,140,255,0.035) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
        maskImage: "radial-gradient(ellipse 70% 80% at 30% 45%, black 20%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(ellipse 70% 80% at 30% 45%, black 20%, transparent 75%)",
      }} />

      <div style={{
        position: "relative", zIndex: 1,
        flex: 1.2, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end",
        padding: "72px 56px 72px 64px",
        borderRight: `1px solid rgba(123,140,255,0.12)`,
      }} className="login-brand">
        <motion.div {...motionPreset.fadeUp} style={{ maxWidth: "620px", width: "100%", textAlign: "left" }}>
          <p style={{
            fontSize: "15px", fontWeight: 600, color: color.accentSoft,
            letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "32px",
            textShadow: "0 0 28px rgba(123,140,255,0.45)",
          }}>
            VISC
          </p>
          <h1 style={{
            fontSize: "56px", fontWeight: 560, color: color.text,
            letterSpacing: "-0.038em", lineHeight: 1.08, marginBottom: "22px",
          }}>
            Visionary Intelligence<br />& Strategic Capital
          </h1>
          <p style={{
            fontSize: "19px", color: color.textSecondary, lineHeight: 1.7,
            marginBottom: "48px", maxWidth: "540px",
          }}>
            Financial intelligence, market analysis, and decision support systems for professional operations.
          </p>
          <div style={{
            padding: "30px 34px", borderRadius: radius.xl,
            border: `1px solid rgba(123,140,255,0.32)`,
            background: `linear-gradient(145deg, rgba(123,140,255,0.14), ${color.card})`,
            boxShadow: "0 0 0 1px rgba(123,140,255,0.06), 0 0 48px rgba(123,140,255,0.16), 0 12px 40px rgba(0,0,0,0.35)",
            maxWidth: "420px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div aria-hidden style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(120deg, rgba(255,255,255,0.04) 0%, transparent 42%)",
            }} />
            <p style={{ position: "relative", fontSize: "22px", fontWeight: 560, color: color.text, marginBottom: "8px" }}>VISC</p>
            <p style={{ position: "relative", fontSize: "16px", color: color.muted }}>Market Intelligence Platform</p>
          </div>
        </motion.div>
      </div>

      <div style={{
        position: "relative", zIndex: 1,
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px",
      }}>
        <motion.div {...motionPreset.fadeUp} transition={{ delay: 0.1 }} style={{ width: "100%", maxWidth: "380px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 500, color: color.text, marginBottom: "6px" }}>Sign In</h2>
          <p style={{ fontSize: "13px", color: color.muted, marginBottom: "32px" }}>Access the operations center</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", color: color.muted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</label>
              <Input icon={<Mail size={14} />} type="email" placeholder="you@company.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", color: color.muted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Password</label>
              <div style={{ position: "relative" }}>
                <Input icon={<Lock size={14} />} type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: color.muted, padding: "4px",
                }}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="primary" loading={loading} fullWidth icon={<ArrowRight size={14} />}>
              Continue
            </Button>
          </form>

          <p style={{ fontSize: "11px", color: color.faint, marginTop: "24px", textAlign: "center" }}>
            Demo: admin@visc.com · any password (6+ characters)
          </p>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .login-brand { display: none !important; }
          .login-glow-pulse { left: 40% !important; width: 80% !important; opacity: 0.7; }
        }
        @keyframes loginGlowDrift {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 1; }
          50% { transform: translate(2%, -1.5%) scale(1.04); opacity: 0.88; }
        }
        .login-glow-pulse {
          animation: loginGlowDrift 14s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
