"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants: Record<string, string> = {
      primary:
        "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] focus-visible:ring-[var(--primary)] shadow-sm hover:shadow-md",
      secondary:
        "bg-[var(--accent)] text-white hover:brightness-95 focus-visible:ring-[var(--accent)] shadow-sm hover:shadow-md",
      outline:
        "border border-[var(--border)] bg-transparent text-foreground hover:bg-[var(--muted)] focus-visible:ring-[var(--primary)]",
      ghost:
        "text-foreground hover:bg-[var(--muted)] focus-visible:ring-[var(--primary)]",
      danger:
        "bg-[var(--danger)] text-white hover:brightness-95 focus-visible:ring-[var(--danger)]",
    };

    const sizes: Record<string, string> = {
      sm: "px-4 py-2 text-sm",
      md: "px-5 py-2.5 text-sm",
      lg: "px-7 py-3.5 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
