"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { isTabRoot } from "@/lib/navigation/tab-routes";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const withTabs = isTabRoot(pathname);

  return (
    <div className="min-h-[100dvh] rondo-page max-w-lg mx-auto relative">
      <main
        className={cn(
          withTabs
            ? "pb-[calc(8.5rem+env(safe-area-inset-bottom))]"
            : "pb-[calc(7.5rem+env(safe-area-inset-bottom))]"
        )}
      >
        {children}
      </main>
      {withTabs && <BottomNav />}
    </div>
  );
}
