"use client";
import { cn } from "@/lib/utils";
import { color, transition } from "@/lib/design";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function Toggle({ checked, onChange, disabled, label, className }: ToggleProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      {label && <span style={{ fontSize: "13px", color: color.textSecondary }}>{label}</span>}
      <button
        type="button" role="switch" aria-checked={checked} disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed", className)}
        style={{ backgroundColor: checked ? color.accent : color.border, transition: transition.fast }}
      >
        <span
          className="inline-block h-3.5 w-3.5 rounded-full transform"
          style={{
            backgroundColor: checked ? color.bg : color.muted,
            transform: checked ? "translateX(18px)" : "translateX(3px)",
            transition: transition.fast,
          }}
        />
      </button>
    </div>
  );
}
