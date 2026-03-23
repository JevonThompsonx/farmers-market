import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline";
}

export function Badge({
  variant = "default",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium",
        variant === "default"
          ? "bg-[var(--color-brand-100)] text-[var(--color-brand-800)]"
          : "border border-[var(--color-brand-300)] text-[var(--color-brand-700)]",
        className,
      )}
      {...props}
    />
  );
}
