"use client";
import { cn } from "@/lib/utils";
import { color, radius, transition, sectionLabel, shadow } from "@/lib/design";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Card({ children, className, hover, padding = "20px", onClick, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn("card-sheen", onClick && "cursor-pointer", className)}
      style={{
        backgroundColor: color.card,
        backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 40%)",
        border: `1px solid ${color.border}`,
        borderRadius: radius.xl,
        padding,
        boxShadow: shadow.card,
        transition: transition.base,
        ...style,
      }}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.borderColor = color.borderStrong;
        e.currentTarget.style.backgroundColor = color.cardHover;
        e.currentTarget.style.boxShadow = shadow.cardHover;
        e.currentTarget.style.transform = "translateY(-1px)";
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.borderColor = color.border;
        e.currentTarget.style.backgroundColor = color.card;
        e.currentTarget.style.boxShadow = shadow.card;
        e.currentTarget.style.transform = "translateY(0)";
      } : undefined}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-between", className)} style={{ marginBottom: "16px" }}>{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <p style={sectionLabel}>{children}</p>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
