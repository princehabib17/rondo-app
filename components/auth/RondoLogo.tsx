import Image from "next/image";
import { cn } from "@/lib/utils";

type RondoLogoProps = {
  size?: "sm" | "lg" | "splash";
  showWordmark?: boolean;
  className?: string;
};

const sizes = {
  sm: { img: 40, word: "text-lg tracking-[0.35em]" },
  lg: { img: 72, word: "text-2xl tracking-[0.4em]" },
  splash: { img: 160, word: "text-3xl tracking-[0.45em]" },
};

export function RondoLogo({ size = "lg", showWordmark = true, className }: RondoLogoProps) {
  const s = sizes[size];

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <Image
        src="/rondo-logo.png"
        alt="RONDO"
        width={s.img}
        height={s.img}
        priority
        className="object-contain"
      />
      {showWordmark && (
        <span className={cn("text-white font-bold uppercase", s.word)}>RONDO</span>
      )}
    </div>
  );
}
