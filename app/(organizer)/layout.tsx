import { AppShell } from "@/components/layout/AppShell";
import { PageTransition } from "@/components/layout/PageTransition";
import { requireCompletedOnboarding } from "@/lib/auth/route-guards";

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  await requireCompletedOnboarding({ requiredRole: "organizer" });

  return (
    <AppShell>
      <PageTransition>{children}</PageTransition>
    </AppShell>
  );
}
