"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Plus } from "lucide-react";
import { rondoFieldClass } from "@/components/rondo/primitives";

type OrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  verified?: boolean;
};

type MembershipRecord = {
  organization_id: string;
  role: "owner" | "admin" | "manager";
  status: "active" | "requested" | "invited" | "rejected";
  organization: OrganizationRecord;
};

interface OrganizationPickerProps {
  value: string;
  onChange: (organizationId: string) => void;
  onReady?: (ready: boolean) => void;
}

export function OrganizationPicker({ value, onChange, onReady }: OrganizationPickerProps) {
  const [memberships, setMemberships] = useState<MembershipRecord[]>([]);
  const [newName, setNewName] = useState("");
  const [newLogoUrl, setNewLogoUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeMemberships = useMemo(
    () => memberships.filter((membership) => membership.status === "active"),
    [memberships]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/organizations");
      if (!res.ok) {
        onReady?.(true);
        return;
      }
      const json = await res.json();
      if (cancelled) return;
      const nextMemberships = (json.memberships ?? []) as MembershipRecord[];
      setMemberships(nextMemberships);
      const firstActive = nextMemberships.find((membership) => membership.status === "active");
      if (!value && firstActive) onChange(firstActive.organization_id);
      onReady?.(true);
    }
    onReady?.(false);
    load();
    return () => {
      cancelled = true;
    };
  }, [onChange, onReady, value]);

  async function createOrganization() {
    if (newName.trim().length < 2 || creating) return;
    setCreating(true);
    setError(null);
    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        logoUrl: newLogoUrl.trim() || undefined,
      }),
    });
    const json = await res.json();
    setCreating(false);
    if (!res.ok) {
      setError(json.error ?? "Could not create organization");
      return;
    }
    const organization = json.organization as OrganizationRecord;
    const membership: MembershipRecord = {
      organization_id: organization.id,
      role: "owner",
      status: "active",
      organization,
    };
    setMemberships((prev) => [membership, ...prev]);
    onChange(organization.id);
    setNewName("");
    setNewLogoUrl("");
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-center gap-2">
        <Building2 size={17} className="text-rondo-accent" />
        <div>
          <p className="font-heading text-sm font-black uppercase text-white">Organizer / Organization</p>
          <p className="text-xs text-white/45">Games and tournaments will show under this name.</p>
        </div>
      </div>

      {activeMemberships.length > 0 && (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={rondoFieldClass}>
          <option value="">Choose organization</option>
          {activeMemberships.map((membership) => (
            <option key={membership.organization_id} value={membership.organization_id}>
              {membership.organization.name}
            </option>
          ))}
        </select>
      )}

      <div className="grid gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={activeMemberships.length ? "Create another organization" : "Organization name"}
          className={rondoFieldClass}
        />
        <input
          value={newLogoUrl}
          onChange={(e) => setNewLogoUrl(e.target.value)}
          placeholder="Logo URL (optional)"
          className={rondoFieldClass}
        />
        <button
          type="button"
          onClick={createOrganization}
          disabled={creating || newName.trim().length < 2}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rondo-accent/35 bg-rondo-accent/10 px-4 font-heading text-xs font-black uppercase tracking-wide text-rondo-accent disabled:opacity-40"
        >
          <Plus size={15} />
          {creating ? "Creating..." : "Save organization"}
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
