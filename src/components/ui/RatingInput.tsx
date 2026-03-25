"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface RatingInputProps {
  name: string;
  value?: number;
  onChange?: (value: number) => void;
  error?: string;
  className?: string;
}

export function RatingInput({
  name,
  value = 0,
  onChange,
  error,
  className,
}: RatingInputProps) {
  const [hovered, setHovered] = useState(0);
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-sm font-medium text-[var(--color-text)]">
        Rating
      </span>
      <div
        className="flex gap-1"
        role="radiogroup"
        aria-label="Rating"
      >
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] rounded-sm"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <svg
              viewBox="0 0 20 20"
              className={cn(
                "h-6 w-6 transition-colors",
                (hovered || value) >= star
                  ? "fill-amber-400 text-amber-400"
                  : "fill-[var(--color-border)] text-[var(--color-border)]",
              )}
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
        <input type="hidden" name={name} value={value} />
      </div>
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
