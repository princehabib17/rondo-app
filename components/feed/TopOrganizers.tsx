import Link from "next/link";
import Image from "next/image";
import { ArrowRight, SealCheck, ShieldCheck } from "@phosphor-icons/react";
import { getOrganizerInitials, type OrganizerGroup } from "@/lib/feed/organizers";

interface TopOrganizersProps {
  organizers: OrganizerGroup[];
  loading?: boolean;
}

export function TopOrganizers({ organizers, loading = false }: TopOrganizersProps) {
  if (!loading && organizers.length === 0) return null;

  return (
    <section className="px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} weight="duotone" className="text-[var(--gold)]" />
          <h2 className="font-heading text-lg font-black uppercase text-[var(--ink-hi)]">
            Top Organizers
          </h2>
        </div>
        <Link
          href="/feed"
          className="flex items-center gap-1 rondo-meta text-[var(--ink-low)] transition-colors hover:text-[var(--gold)]"
        >
          View All
          <ArrowRight size={13} weight="bold" />
        </Link>
      </div>

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex w-[86px] shrink-0 flex-col items-center gap-2 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] p-3">
                <div className="h-14 w-14 rounded-[var(--r-md)] rondo-shimmer" />
                <div className="h-2.5 w-12 rounded rondo-shimmer" />
              </div>
            ))
          : organizers.map((organizer) => {
          const href = `/organizers/${organizer.id}`;

          return (
            <Link
              key={organizer.id}
              href={href}
              className="group flex w-[86px] shrink-0 flex-col items-center gap-2 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-surface)] p-3 transition-colors hover:border-[color-mix(in_oklch,var(--gold)_42%,var(--stroke))]"
            >
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-inset)] transition-colors group-hover:border-[var(--gold)]">
                  {organizer.avatar_url ? (
                    <Image
                      src={organizer.avatar_url}
                      alt=""
                      width={112}
                      height={112}
                      quality={95}
                      sizes="56px"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-heading text-sm font-black text-[var(--ink-hi)]">
                      {getOrganizerInitials(organizer.full_name)}
                    </span>
                  )}
                </div>
                {organizer.verified !== false && (
                  <SealCheck
                    size={16}
                    weight="fill"
                    className="absolute -bottom-0.5 -right-0.5 text-[var(--gold)]"
                  />
                )}
              </div>
              <span className="line-clamp-2 text-center rondo-meta leading-tight text-[var(--ink-mid)]">
                {organizer.full_name}
              </span>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
