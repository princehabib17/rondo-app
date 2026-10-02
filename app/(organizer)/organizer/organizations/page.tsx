"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { OrganizationPicker } from "@/components/organizer/OrganizationPicker";

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

type MemberRecord = {
  user_id: string;
  role: "owner" | "admin" | "manager";
  status: "active" | "requested" | "invited" | "rejected";
  profile?: {
    full_name: string | null;
    phone?: string | null;
    email?: string | null;
    avatar_url: string | null;
  };
};

export default function OrganizerOrganizationsPage() {
  const [memberships, setMemberships] = useState<MembershipRecord[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const loadMemberships = useCallback(async () => {
    const res = await fetch("/api/organizations");
    if (!res.ok) return;
    const json = await res.json();
    const next = (json.memberships ?? []) as MembershipRecord[];
    setMemberships(next);
    const firstAdmin = next.find(
      (membership) =>
        membership.status === "active" &&
        (membership.role === "owner" || membership.role === "admin")
    );
    if (!selectedOrgId && firstAdmin) setSelectedOrgId(firstAdmin.organization_id);
  }, [selectedOrgId]);

  async function loadMembers(organizationId: string) {
    if (!organizationId) {
      setMembers([]);
      return;
    }
    const res = await fetch(`/api/organizations/${organizationId}/members`);
    if (!res.ok) {
      setMembers([]);
      return;
    }
    const json = await res.json();
    setMembers((json.members ?? []) as MemberRecord[]);
  }

  useEffect(() => {
    loadMemberships();
  }, [loadMemberships]);

  useEffect(() => {
    loadMembers(selectedOrgId);
  }, [selectedOrgId]);

  async function updateMember(userId: string, status: "active" | "rejected") {
    if (!selectedOrgId) return;
    setMessage(null);
    const res = await fetch(`/api/organizations/${selectedOrgId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: "manager", status }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error ?? "Could not update member");
      return;
    }
    setMessage(status === "active" ? "Member approved." : "Request rejected.");
    await loadMembers(selectedOrgId);
  }

  const adminMemberships = memberships.filter(
    (membership) =>
      membership.status === "active" &&
      (membership.role === "owner" || membership.role === "admin")
  );
  const pendingMembers = members.filter((member) => member.status === "requested");
  const activeMembers = members.filter((member) => member.status === "active");

  return (
    <div className="min-h-[100dvh] rondo-page pb-20">
      <PageHeader title="Organizations" back fallbackHref="/organizer/dashboard" />

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
        <OrganizationPicker
          value={selectedOrgId}
          onChange={(id) => {
            setSelectedOrgId(id);
            loadMemberships();
          }}
        />

        {adminMemberships.length > 1 && (
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            aria-label="Organization to manage"
            className="w-full bg-[var(--bg-inset)] border border-[var(--stroke)] text-[var(--ink-hi)] rounded-[var(--r-sm)] p-3 text-sm"
          >
            {adminMemberships.map((membership) => (
              <option key={membership.organization_id} value={membership.organization_id}>
                Manage {membership.organization.name}
              </option>
            ))}
          </select>
        )}

        {message && <p className="rondo-meta text-[var(--ink-mid)]">{message}</p>}

        <section className="rondo-surface p-4 space-y-3">
          <h2 className="rondo-label text-[var(--ink-low)]">Join requests</h2>
          {pendingMembers.length === 0 ? (
            <p className="text-[var(--ink-low)] text-sm">Nobody is waiting to join.</p>
          ) : (
            pendingMembers.map((member) => (
              <div key={member.user_id} className="flex items-center justify-between gap-3 rounded-[var(--r-md)] border border-[var(--stroke)] bg-[var(--bg-page)]/25 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--ink-hi)]">
                    {member.profile?.full_name ?? member.profile?.phone ?? member.profile?.email ?? "Unknown user"}
                  </p>
                  <p className="text-xs text-[var(--ink-low)]">{member.profile?.phone ?? member.profile?.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateMember(member.user_id, "rejected")}
                    className="grid size-11 place-items-center rounded-[var(--r-pill)] border border-[var(--stroke)] text-[var(--ink-mid)]"
                    aria-label="Reject request"
                  >
                    <X size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateMember(member.user_id, "active")}
                    className="grid size-11 place-items-center rounded-[var(--r-pill)] bg-[var(--ink-hi)] text-[var(--bg-page)]"
                    aria-label="Approve request"
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="rondo-surface p-4 space-y-3">
          <h2 className="rondo-label text-[var(--ink-low)]">Members</h2>
          {activeMembers.length === 0 ? (
            <p className="text-[var(--ink-low)] text-sm">No active members yet.</p>
          ) : (
            activeMembers.map((member) => (
              <div key={member.user_id} className="flex items-center justify-between gap-3 border-b border-[var(--stroke)] py-2 last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--ink-hi)]">
                    {member.profile?.full_name ?? member.profile?.phone ?? member.profile?.email ?? "Unknown user"}
                  </p>
                  <p className="text-xs text-[var(--ink-low)]">{member.profile?.phone ?? member.profile?.email}</p>
                </div>
                <span className="rounded-full bg-[var(--bg-inset)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--ink-mid)]">
                  {member.role}
                </span>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
