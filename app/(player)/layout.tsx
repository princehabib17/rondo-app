import { AppShell } from "@/components/layout/AppShell";
import { PageTransition } from "@/components/layout/PageTransition";
import { requireCompletedOnboarding } from "@/lib/auth/route-guards";

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  await requireCompletedOnboarding();

  return (
    <AppShell>
      <PageTransition>{children}</PageTransition>
    </AppShell>
  );
}
