import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, ChevronRight, Shield } from "lucide-react";
import { getOrganizerInitials, type OrganizerGroup } from "@/lib/feed/organizers";

interface TopOrganizersProps {
  organizers: OrganizerGroup[];
  loading?: boolean;
}

export function TopOrganizers({ organizers, loading = false }: TopOrganizersProps) {
  return (
    <section className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-rondo-accent" />
          <h2 className="font-heading text-white font-black italic text-sm uppercase tracking-wide">
            Top Organizers
          </h2>
        </div>
        <Link
          href="/feed"
          className="flex items-center gap-0.5 font-body text-white/40 text-xs hover:text-rondo-accent transition-colors"
        >
          View All
          <ChevronRight size={13} strokeWidth={2.5} />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-[72px]">
                <div className="w-14 h-14 rounded-full bg-white/10 animate-pulse" />
                <div className="flex flex-col items-center gap-1">
                  <div className="h-2.5 w-12 rounded bg-white/10 animate-pulse" />
                  <div className="h-2.5 w-8 rounded bg-white/10 animate-pulse" />
                </div>
              </div>
            ))
          : organizers.map((organizer) => {
          const href = `/organizers/${organizer.id}`;

          return (
            <Link
              key={organizer.id}
              href={href}
              className="flex flex-col items-center gap-2 shrink-0 w-[72px] group"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-secondary border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-rondo-accent/50 transition-colors">
                  {organizer.avatar_url ? (
                    <Image
                      src={organizer.avatar_url}
                      alt=""
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-heading text-white font-black text-sm">
                      {getOrganizerInitials(organizer.full_name)}
                    </span>
                  )}
                </div>
                {organizer.verified !== false && (
                  <BadgeCheck
                    size={16}
                    className="absolute -bottom-0.5 -right-0.5 text-rondo-accent fill-black"
                  />
                )}
              </div>
              <span className="font-body text-white/80 text-[10px] text-center leading-tight line-clamp-2 min-h-[28px] flex items-start justify-center">
                {organizer.full_name}
              </span>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
