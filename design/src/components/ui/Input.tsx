"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--foreground-muted)" }}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: "var(--foreground-muted)" }}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-xl bg-[var(--surface)] px-4 py-2.5 text-foreground",
              "placeholder:text-[var(--foreground-muted)] placeholder:opacity-60",
              "border border-[var(--border)]",
              "focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]",
              "transition-all duration-200 outline-none",
              icon ? "pl-10" : undefined,
              error ? "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-red-100" : undefined,
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
