"use client";

import { useRouter } from "next/navigation";
import { useRef, type FormEvent } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  initialValue?: string;
  className?: string;
}

export function SearchBar({ initialValue = "", className }: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = inputRef.current?.value.trim() ?? "";
    if (q.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={cn("flex max-w-full flex-col gap-2 sm:flex-row", className)}
    >
      <label htmlFor="search-input" className="sr-only">
        Search products
      </label>
      <input
        ref={inputRef}
        id="search-input"
        type="search"
        name="q"
        defaultValue={initialValue}
        placeholder="Search for products..."
        minLength={2}
        className="min-h-11 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] sm:flex-1"
      />
      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]"
      >
        Search
      </button>
    </form>
  );
}
