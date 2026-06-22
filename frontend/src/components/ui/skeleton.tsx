"use client";

function SkeletonBase({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded bg-muted/60 ${className}`} style={style} />;
}

export function StatCardSkeleton() {
  return (
    <div className="guild-card bg-card rounded-lg p-5 border-primary/20 space-y-3">
      <div className="flex items-center justify-between">
        <SkeletonBase className="h-3 w-20" />
        <SkeletonBase className="h-5 w-5 rounded-full" />
      </div>
      <SkeletonBase className="h-8 w-28" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 7 }: { cols?: number }) {
  return (
    <tr className="border-b border-border/50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBase className={`h-4 ${i === 0 ? "w-32" : i === cols - 1 ? "w-16" : "w-20"}`} />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div className="guild-card bg-card rounded-lg p-5 border-primary/20 space-y-3">
      <SkeletonBase className="h-4 w-3/4" />
      <SkeletonBase className="h-3 w-full" />
      <SkeletonBase className="h-3 w-5/6" />
      <div className="flex gap-2 pt-2">
        <SkeletonBase className="h-6 w-16 rounded-full" />
        <SkeletonBase className="h-6 w-12 rounded-full" />
      </div>
    </div>
  );
}

export function ChatBubbleSkeleton({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[80%] bg-card border border-border rounded-lg px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <SkeletonBase className="h-3 w-16" />
          <SkeletonBase className="h-3 w-10" />
        </div>
        <SkeletonBase className="h-4 w-64" />
        <SkeletonBase className="h-4 w-48" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="guild-card bg-card rounded-lg p-5 border-primary/20 space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonBase className="h-4 w-32" />
        <SkeletonBase className="h-4 w-20" />
      </div>
      <div className="flex items-end gap-3 h-32 pt-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonBase key={i} className="flex-1 rounded-t" style={{ height: `${30 + Math.random() * 60}%` }} />
        ))}
      </div>
    </div>
  );
}
