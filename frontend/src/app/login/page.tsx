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
    <div className="app-shell" style={{ minHeight: "100vh", display: "flex" }}>
      <div style={{
        flex: 1.15, display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "72px 80px", borderRight: `1px solid ${color.divider}`,
      }} className="login-brand">
        <motion.div {...motionPreset.fadeUp} style={{ maxWidth: "560px" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: color.accentSoft, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "28px" }}>VISC</p>
          <h1 style={{ fontSize: "48px", fontWeight: 560, color: color.text, letterSpacing: "-0.035em", lineHeight: 1.12, marginBottom: "20px" }}>
            Visionary Intelligence<br />& Strategic Capital
          </h1>
          <p style={{ fontSize: "18px", color: color.muted, lineHeight: 1.65, marginBottom: "44px" }}>
            Financial intelligence, market analysis, and decision support systems for professional operations.
          </p>
          <div style={{
            padding: "28px 32px", borderRadius: radius.lg,
            border: `1px solid ${color.accentSoftBorder}`,
            background: `linear-gradient(145deg, ${color.accentSoftBg}, ${color.card})`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}>
            <p style={{ fontSize: "20px", fontWeight: 560, color: color.text, marginBottom: "8px" }}>VISC</p>
            <p style={{ fontSize: "15px", color: color.muted }}>Market Intelligence Platform</p>
          </div>
        </motion.div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px" }}>
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

      <style>{`@media (max-width: 900px) { .login-brand { display: none !important; } }`}</style>
    </div>
  );
}
