import { RondoBrand } from "@/components/brand/RondoBrand";
import { cn } from "@/lib/utils";

type RondoLogoProps = {
  size?: "sm" | "lg" | "splash";
  showWordmark?: boolean;
  className?: string;
};

const sizes = {
  sm: { mark: "size-10", wordmark: "h-8 w-32" },
  lg: { mark: "size-20", wordmark: "h-14 w-56" },
  splash: { mark: "size-32", wordmark: "h-20 w-80 max-w-full" },
};

export function RondoLogo({ size = "lg", showWordmark = true, className }: RondoLogoProps) {
  const s = sizes[size];

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <RondoBrand
        kind={showWordmark ? "wordmark" : "mark"}
        surface="auto"
        className={showWordmark ? s.wordmark : s.mark}
        fetchPriority="high"
      />
    </div>
  );
}
