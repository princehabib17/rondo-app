import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] rondo-page max-w-lg mx-auto relative">
      <main className="pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}
