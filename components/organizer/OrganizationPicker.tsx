"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, ImagePlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { rondoFieldClass } from "@/components/rondo/primitives";
import { ImageCropModal } from "@/components/ui/image-crop-modal";
import { createClient } from "@/lib/supabase/client";

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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeMemberships = useMemo(
    () => memberships.filter((m) => m.status === "active"),
    [memberships]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/organizations");
      if (!res.ok) { onReady?.(true); return; }
      const json = await res.json();
      if (cancelled) return;
      const next = (json.memberships ?? []) as MembershipRecord[];
      setMemberships(next);
      const firstActive = next.find((m) => m.status === "active");
      if (!value && firstActive) onChange(firstActive.organization_id);
      onReady?.(true);
    }
    onReady?.(false);
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openLogoFile(file: File) {
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
  }

  function handleCropDone(blob: Blob) {
    const croppedFile = new File([blob], "logo.jpg", { type: "image/jpeg" });
    setLogoFile(croppedFile);
    setLogoPreview(URL.createObjectURL(blob));
    setCropSrc(null);
  }

  async function uploadLogo(userId: string): Promise<string | null> {
    if (!logoFile) return null;
    const supabase = createClient();
    const ext = logoFile.name.split(".").pop() ?? "jpg";
    const path = `${userId}/org-logos/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("game-covers")
      .upload(path, logoFile, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from("game-covers").getPublicUrl(path);
    return data.publicUrl;
  }

  async function createOrganization() {
    if (newName.trim().length < 2 || creating) return;
    setCreating(true);
    setError(null);

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    let logoUrl: string | undefined;
    if (logoFile && userId) {
      const uploaded = await uploadLogo(userId);
      if (uploaded) logoUrl = uploaded;
    }

    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), logoUrl }),
    });
    const json = await res.json();
    setCreating(false);

    if (!res.ok) {
      setError(json.error ?? "Could not create organization");
      return;
    }

    const org = json.organization as OrganizationRecord;
    const membership: MembershipRecord = {
      organization_id: org.id,
      role: "owner",
      status: "active",
      organization: org,
    };
    setMemberships((prev) => [membership, ...prev]);
    onChange(org.id);
    setNewName("");
    setLogoFile(null);
    setLogoPreview(null);
    toast.success(`"${org.name}" created`);
  }

  return (
    <>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <div className="flex items-center gap-2">
          <Building2 size={17} className="text-rondo-accent" />
          <div>
            <p className="font-heading text-sm font-black uppercase text-white">Organizer / Organization</p>
            <p className="text-xs text-white/45">Games will show under this name.</p>
          </div>
        </div>

        {activeMemberships.length > 0 && (
          <select value={value} onChange={(e) => onChange(e.target.value)} className={rondoFieldClass}>
            <option value="">Choose organization</option>
            {activeMemberships.map((m) => (
              <option key={m.organization_id} value={m.organization_id}>
                {m.organization.name}
              </option>
            ))}
          </select>
        )}

        <div className="grid gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createOrganization()}
            placeholder={activeMemberships.length ? "Create another organization" : "Organization name"}
            className={rondoFieldClass}
          />

          {/* Logo picker with crop */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-14 h-14 rounded-full border-2 border-dashed border-white/20 bg-white/[0.03] flex items-center justify-center overflow-hidden shrink-0 hover:border-rondo-accent/50 transition-colors"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus size={18} className="text-white/30" />
              )}
            </button>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-rondo-accent font-semibold"
              >
                {logoPreview ? "Change logo" : "Add logo (optional)"}
              </button>
              <p className="text-xs text-white/30 mt-0.5">Square crop applied automatically</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) openLogoFile(f);
                e.target.value = "";
              }}
            />
          </div>

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

      {/* Logo crop modal */}
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          aspect={1}
          label="Crop logo"
          onDone={handleCropDone}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </>
  );
}
