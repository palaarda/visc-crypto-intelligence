import { cn } from "@/lib/utils";
import { color } from "@/lib/design";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return <div className={cn("skeleton", className)} style={{ backgroundColor: color.inset, ...style }} />;
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: "14px 16px" }}><Skeleton style={{ height: "14px", width: "100%" }} /></td>
      ))}
    </tr>
  );
}
