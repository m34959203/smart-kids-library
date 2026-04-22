"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple" | "pink";
  size?: "sm" | "md";
  className?: string;
}

export default function Badge({ children, variant = "default", size = "sm", className }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-[var(--muted)] text-[var(--foreground-muted)]",
    success: "bg-[var(--primary-light)] text-[var(--primary-dark)]",
    warning: "bg-amber-100 text-amber-800",
    danger:  "bg-red-50 text-[var(--danger)]",
    info:    "bg-blue-50 text-[var(--info)]",
    purple:  "bg-[var(--primary-light)] text-[var(--primary-dark)]",
    pink:    "bg-[var(--accent-light)] text-[var(--accent)]",
  };

  const sizes: Record<string, string> = {
    sm: "px-2.5 py-0.5 text-[10px] tracking-widest uppercase",
    md: "px-3 py-1 text-xs tracking-wider uppercase",
  };

  return (
    <span className={cn("inline-flex items-center font-semibold rounded-full", variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}
