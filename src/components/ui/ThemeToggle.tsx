"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  // Initialize theme on mount from the DOM attribute (set by the head script)
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme") as Theme;
    setTheme(currentTheme || "light");
  }, []);

  function toggleTheme() {
    if (!theme) return;
    
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
  }

  // Prevent flash of wrong icon by waiting for mount
  if (!theme) {
    return (
      <div className={cn("h-9 w-9 p-2", className)} aria-hidden="true" />
    );
  }

  const icons: Record<Theme, string> = {
    light: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
    dark: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
  };

  const labels: Record<Theme, string> = {
    light: "Switch to dark mode",
    dark: "Switch to light mode",
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "rounded-[var(--radius-md)] p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]",
        className,
      )}
      aria-label={labels[theme]}
      title={labels[theme]}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={icons[theme]} />
      </svg>
    </button>
  );
}
