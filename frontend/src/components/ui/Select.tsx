"use client";
import { color, radius, transition } from "@/lib/design";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, style, children, ...props }: SelectProps) {
  return (
    <div>
      {label && <label style={{ display: "block", fontSize: "11px", color: color.muted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>}
      <select
        {...props}
        style={{
          width: "100%",
          backgroundColor: color.inset,
          color: color.text,
          fontSize: "13px",
          border: `1px solid ${color.border}`,
          borderRadius: radius.md,
          padding: "9px 12px",
          outline: "none",
          cursor: "pointer",
          transition: transition.fast,
          appearance: "none",
          fontFamily: "inherit",
          ...style,
        }}
      >
        {children}
      </select>
    </div>
  );
}
