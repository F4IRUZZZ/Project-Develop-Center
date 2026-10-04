"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = "text", width, height, className: classNameProp }: SkeletonProps) {
  const base = "animate-pulse rounded bg-muted";
  const variants = {
    text: "h-4 w-full",
    circular: "rounded-full",
    rectangular: "rounded-[9px]",
  };

  const widthStyle = width ? { width: typeof width === "number" ? `${width}px` : width } : {};
  const heightStyle = height ? { height: typeof height === "number" ? `${height}px` : height } : {};

  return (
    <div
      className={cn(base, variants[variant], className, classNameProp)}
      style={{ ...widthStyle, ...heightStyle }}
      aria-hidden="true"
      aria-label="Memuat..."
    />
  );
}

export function SkeletonText({ lines = 3, className, ...props }: { lines?: number; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="h-4 bg-muted animate-pulse rounded" style={{ width: i === lines - 1 ? "60%" : "100%" }} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className, ...props }: { className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-[18px]", className)} {...props}>
      <div className="h-6 w-3/4 bg-muted animate-pulse rounded mb-4" />
      <div className="space-y-3">
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
        <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className, ...props }: { rows?: number; cols?: number; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card overflow-hidden", className)} {...props}>
      <div className="border-b border-border px-4 py-3">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${4}, 1fr)` }}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${4}, 1fr)` }}>
            {Array.from({ length: 4 }, (_, j) => (
              <div key={j} className="h-5 bg-muted animate-pulse rounded" style={{ width: j === 0 ? "80%" : j === 1 ? "60%" : "50%" }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}