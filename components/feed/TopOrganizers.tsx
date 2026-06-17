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
    <section className="px-4 pt-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={13} className="text-rondo-accent" />
          <span className="rondo-kicker text-white/70">Top Organizers</span>
        </div>
        <Link
          href="/feed"
          className="flex items-center gap-0.5 font-body text-white/30 text-[11px] hover:text-rondo-accent transition-colors"
        >
          View All
          <ChevronRight size={12} strokeWidth={2.5} />
        </Link>
      </div>

      <div className="flex gap-5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-[64px]">
                <div className="w-[60px] h-[60px] rounded-full bg-white/8 animate-pulse" />
                <div className="h-2.5 w-12 rounded bg-white/8 animate-pulse" />
              </div>
            ))
          : organizers.map((organizer) => {
              const href = `/organizers/${organizer.id}`;
              const verified = organizer.verified !== false;

              return (
                <Link
                  key={organizer.id}
                  href={href}
                  className="flex flex-col items-center gap-2 shrink-0 w-[64px] group active:opacity-70 transition-opacity"
                >
                  <div className="relative">
                    {/* Gradient ring for verified organizers */}
                    {verified && (
                      <div
                        className="absolute -inset-[2px] rounded-full"
                        style={{
                          background: "conic-gradient(from 0deg, rgba(255,250,152,0.9), rgba(255,200,0,0.5), rgba(255,250,152,0.2), rgba(255,200,0,0.5), rgba(255,250,152,0.9))",
                          borderRadius: "50%",
                        }}
                      />
                    )}
                    <div className={`relative w-[60px] h-[60px] rounded-full bg-[#1a1a1a] flex items-center justify-center overflow-hidden border ${verified ? "border-[#111]" : "border-white/[0.08]"}`}
                      style={{ margin: verified ? "2px" : "0" }}
                    >
                      {organizer.avatar_url ? (
                        <Image
                          src={organizer.avatar_url}
                          alt=""
                          width={60}
                          height={60}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-heading text-white font-black text-sm italic">
                          {getOrganizerInitials(organizer.full_name)}
                        </span>
                      )}
                    </div>
                    {verified && (
                      <BadgeCheck
                        size={17}
                        className="absolute -bottom-0.5 -right-0.5 text-rondo-accent drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                        style={{ filter: "drop-shadow(0 0 4px rgba(255,250,152,0.5))" }}
                      />
                    )}
                  </div>
                  <span className="font-body text-white/65 text-[10px] text-center leading-tight line-clamp-2 group-hover:text-white/90 transition-colors">
                    {organizer.full_name}
                  </span>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
