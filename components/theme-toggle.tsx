"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || resolvedTheme !== "light";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-pill)] text-[var(--ink-mid)] transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--ink-hi)] active:scale-[0.98]",
        className
      )}
    >
      {isDark ? <Sun size={20} weight="duotone" aria-hidden /> : <Moon size={20} weight="duotone" aria-hidden />}
    </button>
  );
}
