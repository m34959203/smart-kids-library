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
    const base = "rounded-2xl overflow-hidden";

    const variants = {
      default: "bg-white shadow-md",
      elevated: "bg-white shadow-xl",
      bordered: "bg-white border-2 border-purple-100",
      colored: `${color ?? "bg-gradient-to-br from-purple-100 to-pink-100"} shadow-md`,
    };

    const hover = hoverable
      ? "transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
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
    <div className={cn("p-4 pb-2", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4 pt-2 border-t border-gray-100", className)} {...props}>
      {children}
    </div>
  );
}

export default Card;
