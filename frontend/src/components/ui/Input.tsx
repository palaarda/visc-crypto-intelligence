"use client";
import { cn } from "@/lib/utils";
import { color, radius, transition } from "@/lib/design";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ error, icon, className, style, ...props }: InputProps) {
  return (
    <div className="relative w-full">
      {icon && (
        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: color.muted, pointerEvents: "none" }}>
          {icon}
        </span>
      )}
      <input
        {...props}
        className={cn("input-base w-full", error && "input-error", className)}
        style={{
          backgroundColor: color.inset,
          color: color.text,
          fontSize: "13px",
          border: `1px solid ${error ? color.dangerBorder : color.border}`,
          borderRadius: radius.md,
          padding: icon ? "9px 12px 9px 36px" : "9px 12px",
          outline: "none",
          transition: transition.fast,
          fontFamily: "inherit",
          ...style,
        }}
      />
      {error && <p style={{ fontSize: "11px", color: color.danger, marginTop: "6px" }}>{error}</p>}
    </div>
  );
}
