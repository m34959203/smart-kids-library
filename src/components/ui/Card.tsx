"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered" | "colored";
  color?: string;
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", color, hoverable = false, children, ...props }, ref) => {
    const base = "rounded-[22px] overflow-hidden bg-surface border";

    const variants: Record<string, string> = {
      default: "border-[var(--border)] shadow-[var(--shadow-sm)]",
      elevated: "border-[var(--border)] shadow-[var(--shadow-md)]",
      bordered: "border-[var(--border)]",
      colored: `border-transparent ${color ?? "bg-[var(--muted)]"}`,
    };

    const hover = hoverable
      ? "transition-all duration-300 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 hover:border-[#d8cfbc] cursor-pointer"
      : "";

    return (
      <div ref={ref} className={cn(base, variants[variant], hover, className)} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5 pb-2", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5 pt-3 border-t border-[var(--border)]", className)} {...props}>
      {children}
    </div>
  );
}

export default Card;
