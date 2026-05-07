import Link from "next/link";
import { getFlagEmoji } from "@/lib/utils/format";
import type { Profile } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface PlayerAvatarProps {
  profile: Profile;
  size?: "xs" | "sm" | "md" | "lg";
  showFlag?: boolean;
  linkable?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "w-7 h-7 text-[10px]",
  sm: "w-9 h-9 text-xs",
  md: "w-11 h-11 text-sm",
  lg: "w-16 h-16 text-base",
};

const flagSizes = {
  xs: "text-[8px] -bottom-0.5 -right-0.5",
  sm: "text-[10px] -bottom-0.5 -right-0.5",
  md: "text-xs -bottom-1 -right-1",
  lg: "text-sm -bottom-1 -right-1",
};

export function PlayerAvatar({ profile, size = "md", showFlag = true, linkable = true, className }: PlayerAvatarProps) {
  const initials = (profile.full_name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const flag = profile.nationality ? getFlagEmoji(profile.nationality) : "";

  const inner = (
    <div className={cn("relative inline-block", className)}>
      <div
        className={cn(
          sizeClasses[size],
          "rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-rondo-yellow/60 transition-colors"
        )}
      >
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name ?? "Player"}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-muted-foreground font-semibold">{initials}</span>
        )}
      </div>
      {showFlag && flag && (
        <span className={cn("absolute leading-none", flagSizes[size])}>{flag}</span>
      )}
    </div>
  );

  if (linkable) {
    return (
      <Link href={`/profile/${profile.id}`} className="inline-block" aria-label={`View ${profile.full_name}'s profile`}>
        {inner}
      </Link>
    );
  }
  return inner;
}

export function PlayerAvatarStack({ profiles, max = 4 }: { profiles: Profile[]; max?: number }) {
  const visible = profiles.slice(0, max);
  const overflow = profiles.length - max;
  return (
    <div className="flex -space-x-2">
      {visible.map((p) => (
        <PlayerAvatar key={p.id} profile={p} size="sm" showFlag={false} linkable />
      ))}
      {overflow > 0 && (
        <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-xs text-muted-foreground font-medium">
          +{overflow}
        </div>
      )}
    </div>
  );
}
