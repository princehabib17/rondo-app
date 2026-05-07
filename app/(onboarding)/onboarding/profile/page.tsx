"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NATIONALITIES } from "@/lib/utils/format";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name required"),
  bio: z.string().max(200).optional(),
  nationality: z.string().optional(),
  position: z.enum(["goalkeeper", "defender", "midfielder", "forward", "any"]).optional(),
  preferred_foot: z.enum(["left", "right", "both"]).optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfileSetupPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onSubmit(data: ProfileForm) {
    if (!userId) return;
    setError(null);
    const supabase = createClient();

    let avatar_url: string | undefined;

    // Upload avatar if provided
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `avatars/${userId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatar_url = urlData.publicUrl;
      }
    }

    const role = (sessionStorage.getItem("selectedRole") ?? "player") as "player" | "organizer";

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        bio: data.bio ?? null,
        nationality: data.nationality ?? null,
        position: data.position ?? null,
        preferred_foot: data.preferred_foot ?? null,
        role,
        ...(avatar_url ? { avatar_url } : {}),
      })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    sessionStorage.removeItem("selectedRole");
    router.push("/feed");
  }

  return (
    <div className="flex flex-col min-h-screen p-6">
      <h1 className="text-white font-bold text-2xl tracking-widest uppercase text-center pt-4 mb-6">
        Your Profile
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1">
        {/* Avatar */}
        <div className="flex justify-center mb-2">
          <label className="cursor-pointer group">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-border group-hover:border-rondo-yellow flex items-center justify-center overflow-hidden transition">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-muted-foreground text-xs text-center px-2">Add Photo</span>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>

        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Full Name *</Label>
          <Input {...register("full_name")} placeholder="Juan dela Cruz" className="bg-secondary border-border text-white" />
          {errors.full_name && <p className="text-destructive text-xs">{errors.full_name.message}</p>}
        </div>

        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Bio</Label>
          <textarea
            {...register("bio")}
            placeholder="Tell others about yourself..."
            className="w-full bg-secondary border border-border text-white rounded-lg p-3 text-sm resize-none h-20 focus:border-rondo-yellow focus:outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Nationality</Label>
          <select {...register("nationality")} className="w-full bg-secondary border border-border text-white rounded-lg p-3 text-sm focus:border-rondo-yellow focus:outline-none">
            <option value="">Select nationality</option>
            {NATIONALITIES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Position</Label>
          <select {...register("position")} className="w-full bg-secondary border border-border text-white rounded-lg p-3 text-sm focus:border-rondo-yellow focus:outline-none">
            <option value="">Select position</option>
            <option value="goalkeeper">Goalkeeper</option>
            <option value="defender">Defender</option>
            <option value="midfielder">Midfielder</option>
            <option value="forward">Forward</option>
            <option value="any">Any</option>
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Preferred Foot</Label>
          <select {...register("preferred_foot")} className="w-full bg-secondary border border-border text-white rounded-lg p-3 text-sm focus:border-rondo-yellow focus:outline-none">
            <option value="">Select foot</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="both">Both</option>
          </select>
        </div>

        {error && <p className="text-destructive text-sm text-center">{error}</p>}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-rondo-yellow text-rondo-black font-bold uppercase tracking-wider text-base py-6 hover:brightness-90"
        >
          {isSubmitting ? "Saving..." : "Continue"}
        </Button>
      </form>
    </div>
  );
}
