import { AppShell } from "@/components/layout/AppShell";

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
