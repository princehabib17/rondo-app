import { RondoPage } from "@/components/rondo/primitives";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <RondoPage className="flex min-h-[100dvh] flex-col">{children}</RondoPage>;
}
