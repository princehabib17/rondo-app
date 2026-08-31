import { RondoBrand } from "@/components/brand/RondoBrand";

export function OnboardingHeader({ surface = "auto" }: { surface?: "auto" | "light" | "dark" }) {
  return (
    <div className="pt-2">
      <RondoBrand kind="wordmark" surface={surface} className="h-8 w-32" fetchPriority="high" />
    </div>
  );
}
