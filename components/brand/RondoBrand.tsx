import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandKind = "mark" | "wordmark";
type BrandSurface = "auto" | "light" | "dark";

type RondoBrandProps = {
  kind?: BrandKind;
  surface?: BrandSurface;
  className?: string;
  alt?: string;
  fetchPriority?: "high" | "low" | "auto";
};

const assets = {
  mark: {
    light: "/brand/rondo-mark-on-light.png",
    dark: "/brand/rondo-mark-on-dark.png",
    sizes: "40px",
    defaultClassName: "size-10",
  },
  wordmark: {
    light: "/brand/rondo-wordmark-on-light.png",
    dark: "/brand/rondo-wordmark-on-dark.png",
    sizes: "160px",
    defaultClassName: "h-10 w-40",
  },
} as const;

export function RondoBrand({
  kind = "wordmark",
  surface = "auto",
  className,
  alt = "RONDO",
  fetchPriority = "auto",
}: RondoBrandProps) {
  const asset = assets[kind];
  const containerClassName = cn("relative block shrink-0", asset.defaultClassName, className);
  const sharedProps = {
    fill: true,
    sizes: asset.sizes,
    fetchPriority,
    className: "object-contain object-left",
  } as const;

  if (surface === "light") {
    return (
      <span className={containerClassName}>
        <Image {...sharedProps} src={asset.light} alt={alt} />
      </span>
    );
  }

  if (surface === "dark") {
    return (
      <span className={containerClassName}>
        <Image {...sharedProps} src={asset.dark} alt={alt} />
      </span>
    );
  }

  return (
    <span className={containerClassName}>
      <Image {...sharedProps} src={asset.light} alt={alt} className="object-contain object-left dark:hidden" />
      <Image {...sharedProps} src={asset.dark} alt={alt} className="hidden object-contain object-left dark:block" />
    </span>
  );
}
