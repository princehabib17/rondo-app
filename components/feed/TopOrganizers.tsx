import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Shield } from "lucide-react";
import { getOrganizerInitials, type OrganizerGroup } from "@/lib/feed/organizers";

interface TopOrganizersProps {
  organizers: OrganizerGroup[];
}

export function TopOrganizers({ organizers }: TopOrganizersProps) {
  return (
    <section className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-rondo-accent" />
          <h2 className="font-heading text-white font-black italic text-sm uppercase tracking-wide">
            Top Organizers
          </h2>
        </div>
        <Link href="/feed" className="font-body text-white/50 text-xs hover:text-white transition-colors">
          View All &gt;
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
        {organizers.map((organizer) => {
          const href = organizer.id.startsWith("placeholder")
            ? "/feed"
            : `/organizers/${organizer.id}`;

          return (
            <Link
              key={organizer.id}
              href={href}
              className="flex flex-col items-center gap-2 shrink-0 w-[72px] group"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-[#1c1c1c] border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-rondo-accent/50 transition-colors">
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
              <span className="font-body text-white/80 text-[10px] text-center leading-tight line-clamp-2">
                {organizer.full_name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
