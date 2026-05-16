import { cn } from "@/lib/utils";

type RondoMarkProps = {
  className?: string;
  showWordmark?: boolean;
};

export function RondoMark({ className, showWordmark = false }: RondoMarkProps) {
  return (
    <div className={cn("flex flex-col items-center gap-8", className)}>
      <svg
        viewBox="0 0 256 256"
        className="h-24 w-24"
        role="img"
        aria-label="Rondo"
      >
        <path
          d="M21 150C8 93 47 35 108 18c28-8 58-2 80 16-28-9-63-3-93 18-42 29-61 74-47 112 8 22 25 38 47 46-36-1-65-24-74-60Z"
          fill="#efc85d"
        />
        <path
          d="M45 143C34 96 67 47 119 32c21-6 43-4 61 5-24-2-52 7-76 27-36 30-51 73-35 104 10 20 31 31 56 31-38 11-71-11-80-56Z"
          fill="#ffe6a1"
        />
        <path
          d="M95 213c39 25 99 9 132-40 32-47 28-103-8-127 30 9 50 35 53 69 4 50-35 102-89 119-34 11-66 3-88-21Z"
          fill="#fff7df"
        />
        <path
          d="M42 91C60 47 104 17 150 20c39 3 70 28 78 63-14-28-45-43-81-37-43 7-82 41-98 82-4 10-6 20-7 29-5-20-5-42 0-66Z"
          fill="#fff7df"
        />
        <circle cx="117" cy="215" r="11" fill="#ffe6a1" />
      </svg>
      {showWordmark && (
        <div className="pl-[0.38em] text-4xl font-light tracking-[0.38em] text-white">
          RONDO
        </div>
      )}
    </div>
  );
}
