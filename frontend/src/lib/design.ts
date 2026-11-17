import type { CSSProperties } from "react";

/**
 * SAHA OPERASYONU — Design System Tokens
 *
 * Ultra-dark, premium, sakin. Piyasa yeşili/kırmızısı yalnızca sonuçlarda.
 * Arayüz chrome'u soğuk gri-mavi vurgu ile derinleştirilir — yavan flat değil,
 * gürültülü neon da değil.
 */

export const color = {
  bg: "#08090B",
  bgSecondary: "#0C0E12",
  card: "#12151A",
  cardHover: "#171B22",
  inset: "#0A0C10",

  border: "#232833",
  borderStrong: "#343B4A",
  divider: "#1A1E27",

  text: "#F4F5F7",
  textSecondary: "#A8B0C0",
  muted: "#6B7385",
  faint: "#454B5A",

  /** UI chrome vurgusu (menü, focus, marka) — piyasa rengi değil */
  accent: "#E8EAED",
  accentSoft: "#7B8CFF",
  accentSoftBg: "rgba(123,140,255,0.10)",
  accentSoftBorder: "rgba(123,140,255,0.28)",

  success: "#1ECB8C",
  danger: "#F0455A",
  warning: "#F0B429",
  info: "#5BA3FF",

  successBg: "rgba(30,203,140,0.10)",
  dangerBg: "rgba(240,69,90,0.10)",
  warningBg: "rgba(240,180,41,0.10)",
  infoBg: "rgba(91,163,255,0.10)",
  successBorder: "rgba(30,203,140,0.28)",
  dangerBorder: "rgba(240,69,90,0.28)",
  warningBorder: "rgba(240,180,41,0.28)",
  infoBorder: "rgba(91,163,255,0.28)",
} as const;

export const radius = {
  sm: "6px",
  md: "10px",
  lg: "14px",
  xl: "18px",
  full: "999px",
} as const;

export const transition = {
  fast: "all 0.15s ease",
  base: "all 0.2s ease",
} as const;

export const shadow = {
  card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.28)",
  cardHover: "0 1px 0 rgba(255,255,255,0.06) inset, 0 12px 32px rgba(0,0,0,0.4)",
  soft: "0 4px 20px rgba(0,0,0,0.35)",
} as const;

export const motionPreset = {
  fadeUp: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.18 },
  },
  dropdown: {
    initial: { opacity: 0, y: 8, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 6, scale: 0.98 },
    transition: { duration: 0.16 },
  },
} as const;

export const font = {
  mono: "var(--font-geist-mono), ui-monospace, monospace",
} as const;

export const space = {
  1: "8px",
  2: "16px",
  3: "24px",
  4: "32px",
  5: "40px",
  6: "48px",
} as const;

export const layout = {
  sidebarWidth: 248,
  sidebarCollapsed: 72,
  navbarHeight: 56,
  contentMaxWidth: 1440,
} as const;

export const surface: CSSProperties = {
  backgroundColor: color.card,
  border: `1px solid ${color.border}`,
  borderRadius: radius.xl,
  boxShadow: shadow.card,
};

export const insetSurface: CSSProperties = {
  backgroundColor: color.inset,
  border: `1px solid ${color.divider}`,
  borderRadius: radius.md,
};

export const sectionLabel: CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: color.muted,
  textTransform: "uppercase",
  letterSpacing: "0.09em",
};

export const th: CSSProperties = {
  padding: "11px 16px",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: 500,
  color: color.muted,
  whiteSpace: "nowrap",
  borderBottom: `1px solid ${color.divider}`,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

export const td: CSSProperties = {
  padding: "14px 16px",
  fontSize: "13px",
  color: color.textSecondary,
};

export const mono: CSSProperties = {
  fontFamily: font.mono,
  fontVariantNumeric: "tabular-nums",
};

export function marketColor(value: number): string {
  if (value > 0) return color.success;
  if (value < 0) return color.danger;
  return color.textSecondary;
}
