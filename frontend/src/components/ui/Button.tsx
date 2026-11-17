"use client";
import { cn } from "@/lib/utils";
import { color, radius, transition, shadow } from "@/lib/design";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const sizes = {
  sm: { fontSize: "12px", padding: "6px 12px", gap: "6px" },
  md: { fontSize: "13px", padding: "9px 16px", gap: "8px" },
  lg: { fontSize: "14px", padding: "11px 20px", gap: "8px" },
};

export function Button({
  children, variant = "secondary", size = "md", loading, icon,
  fullWidth, className, disabled, style, ...props
}: ButtonProps) {
  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(180deg, #F7F8FA 0%, #E4E6EB 100%)",
      color: color.bg,
      border: "1px solid rgba(255,255,255,0.2)",
      fontWeight: 550,
      boxShadow: "0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(0,0,0,0.25)",
    },
    secondary: {
      backgroundColor: color.card,
      color: color.text,
      border: `1px solid ${color.border}`,
      boxShadow: shadow.soft,
    },
    danger: {
      backgroundColor: color.dangerBg,
      color: color.danger,
      border: `1px solid ${color.dangerBorder}`,
    },
    ghost: {
      backgroundColor: "transparent",
      color: color.textSecondary,
      border: "1px solid transparent",
    },
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn("inline-flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed", className)}
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: radius.md,
        transition: transition.fast,
        width: fullWidth ? "100%" : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled || loading) return;
        if (variant === "primary") e.currentTarget.style.filter = "brightness(1.05)";
        else if (variant === "ghost") e.currentTarget.style.backgroundColor = color.cardHover;
        else e.currentTarget.style.borderColor = color.borderStrong;
      }}
      onMouseLeave={(e) => {
        if (variant === "primary") e.currentTarget.style.filter = "none";
        else if (variant === "ghost") e.currentTarget.style.backgroundColor = "transparent";
        else e.currentTarget.style.borderColor = color.border;
      }}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
