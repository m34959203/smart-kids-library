"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circle" | "rect";
  width?: string;
  height?: string;
}

export default function Skeleton({ className, variant = "text", width, height }: SkeletonProps) {
  const variants = {
    text: "h-4 rounded-md",
    circle: "rounded-full",
    rect: "rounded-xl",
  };

  return (
    <div
      className={cn("animate-pulse bg-purple-100", variants[variant], className)}
      style={{ width, height }}
    />
  );
}

export function BookCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 space-y-3">
      <Skeleton variant="rect" className="w-full h-48" />
      <Skeleton className="w-3/4 h-5" />
      <Skeleton className="w-1/2 h-4" />
      <Skeleton className="w-full h-3" />
      <Skeleton className="w-full h-3" />
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 space-y-3">
      <div className="flex gap-3">
        <Skeleton variant="rect" className="w-16 h-16" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-3/4 h-5" />
          <Skeleton className="w-1/2 h-4" />
        </div>
      </div>
      <Skeleton className="w-full h-3" />
    </div>
  );
}
