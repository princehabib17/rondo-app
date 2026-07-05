"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { getPostOnboardingPath } from "@/lib/auth/role-routing";
import { NATIONALITIES } from "@/lib/utils/format";

const baseProfileSchema = z.object({
  full_name: z.string().min(2, "Name required"),
  age: z.string(),
  gender: z.string(),
  phone: z.string().min(7, "Phone required"),
  address: z.string(),
  nationality: z.string().min(1, "Nationality required"),
  position: z.string(),
  skill_level: z.string(),
  preferred_areas: z.string().min(2, "Preferred areas required"),
  game_preference: z.string(),
  bio: z.string(),
});

const playerSchema = baseProfileSchema.extend({
  age: z.string().min(1, "Age required"),
  gender: z.string().min(1, "Gender required"),
  address: z.string().min(2, "Address required"),
});

type ProfileForm = z.infer<typeof baseProfileSchema>;

const labelClass = "font-heading text-white text-xs uppercase tracking-wider";
const inputClass =
  "w-full bg-[#1c1c1c] border-0 text-white font-body text-sm px-4 py-3.5 rounded-xl placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-rondo-accent/50";

export default function PlayerSetupPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"player" | "organizer">("player");
  const isOrganizer = userRole === "organizer";

  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(baseProfileSchema),
    defaultValues: {
      nationality: "Philippines",
    },
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/");
        return;
      }
      setUserId(data.user.id);

      const meta = data.user.user_metadata ?? {};
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileData?.avatar_url) {
        setAvatarPreview(profileData.avatar_url);
      }

      const savedRole = sessionStorage.getItem("selectedRole") as "player" | "organizer" | null;
      setUserRole(savedRole ?? (profileData?.role as "player" | "organizer") ?? "player");

      reset({
        full_name: profileData?.full_name ?? "",
        age: meta.age ?? "",
        gender: meta.gender ?? "",
        phone: meta.phone ?? "",
        address: meta.address ?? "",
        nationality: profileData?.nationality ?? meta.nationality ?? "Philippines",
        position: profileData?.position ?? "",
        skill_level: profileData?.skill_level ?? "",
        preferred_areas: profileData?.preferred_areas ?? meta.preferred_areas ?? "",
        game_preference: profileData?.game_preference ?? meta.game_preference ?? "",
        bio: profileData?.bio ?? "",
      });
    });
  }, [router, reset]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onSubmit(data: ProfileForm) {
    if (!userId) return;
    setError(null);

    // Player-only requirements, checked here because the role is dynamic.
    if (!isOrganizer) {
      const playerCheck = playerSchema.safeParse(data);
      if (!playerCheck.success) {
        for (const issue of playerCheck.error.issues) {
          setFieldError(issue.path[0] as keyof ProfileForm, { message: issue.message });
        }
        return;
      }
    }

    const supabase = createClient();

    let avatar_url: string | undefined;
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatar_url = urlData.publicUrl;
      }
    }

    const role = userRole;

    await supabase.auth.updateUser({
      data: {
        age: data.age,
        gender: data.gender,
        phone: data.phone,
        address: data.address,
      },
    });

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        nationality: data.nationality,
        preferred_areas: data.preferred_areas,
        game_preference: data.game_preference,
        bio: data.bio || null,
        role,
        ...(role === "player" ? {
          position: data.position,
          skill_level: data.skill_level,
        } : {}),
        ...(avatar_url ? { avatar_url } : {}),
      })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    sessionStorage.removeItem("selectedRole");
    router.push(getPostOnboardingPath(role));
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-black flex flex-col px-6 py-8 max-w-lg mx-auto">
      <OnboardingHeader />

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col mt-6">
        <div className="flex justify-center mb-8">
          <label className="relative cursor-pointer">
            <div className="w-36 h-36 rounded-full bg-[#1c1c1c] flex items-center justify-center overflow-hidden border border-white/10">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <Upload className="text-white/50 w-10 h-10" strokeWidth={1.5} />
              )}
            </div>
            <span className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-rondo-accent flex items-center justify-center border-2 border-black">
              <User className="w-4 h-4 text-black" strokeWidth={2.5} />
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>

        <div className="space-y-4 flex-1">
          {isOrganizer && (
            <div className="space-y-1 pb-1">
              <h2 className="font-heading text-white font-black italic text-lg uppercase">
                Set up your organizer profile
              </h2>
              <p className="text-white/50 text-xs font-body">
                This is what players see when they browse your games.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className={labelClass}>{isOrganizer ? "Organizer / brand name" : "Full name"}</label>
            <input
              {...register("full_name")}
              placeholder={isOrganizer ? "Urban Futsal MNL" : "Miguel Santos"}
              className={inputClass}
            />
            {errors.full_name && <p className="text-red-400 text-xs font-body">{errors.full_name.message}</p>}
          </div>

          {!isOrganizer && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className={labelClass}>Age</label>
                <input {...register("age")} placeholder="24" className={inputClass} />
                {errors.age && <p className="text-red-400 text-xs font-body">{errors.age.message}</p>}
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Gender</label>
                <input {...register("gender")} placeholder="Male" className={inputClass} />
                {errors.gender && <p className="text-red-400 text-xs font-body">{errors.gender.message}</p>}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className={labelClass}>{isOrganizer ? "Contact number" : "Phone number"}</label>
            <input {...register("phone")} type="tel" placeholder="0917 123 4567" className={inputClass} />
            {errors.phone && <p className="text-red-400 text-xs font-body">{errors.phone.message}</p>}
          </div>

          {!isOrganizer && (
            <div className="space-y-2">
              <label className={labelClass}>Address</label>
              <input {...register("address")} placeholder="Taguig City" className={inputClass} />
              {errors.address && <p className="text-red-400 text-xs font-body">{errors.address.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <label className={labelClass}>Nationality</label>
            <select {...register("nationality")} className={inputClass}>
              {NATIONALITIES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            {errors.nationality && (
              <p className="text-red-400 text-xs font-body">{errors.nationality.message}</p>
            )}
          </div>

          {userRole === "player" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className={labelClass}>Position</label>
                <select {...register("position")} className={inputClass}>
                  <option value="">Select</option>
                  <option value="goalkeeper">Goalkeeper</option>
                  <option value="defender">Defender</option>
                  <option value="midfielder">Midfielder</option>
                  <option value="forward">Forward</option>
                  <option value="any">Any</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Skill level</label>
                <select {...register("skill_level")} className={inputClass}>
                  <option value="">Select</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
            </div>
          )}

          {!isOrganizer && (
            <div className="space-y-2">
              <label className={labelClass}>Game preference</label>
              <select {...register("game_preference")} className={inputClass}>
                <option value="">Select</option>
                <option value="football">Football</option>
                <option value="futsal">Futsal</option>
                <option value="both">Both</option>
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className={labelClass}>{isOrganizer ? "Areas you host games in" : "Preferred areas"}</label>
            <input {...register("preferred_areas")} placeholder="BGC, Makati, Ortigas" className={inputClass} />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>
              {isOrganizer ? "About your games" : "Tell us more about you"}
              <span className="text-white/30 normal-case text-[11px] ml-1">(optional)</span>
            </label>
            <textarea
              {...register("bio")}
              placeholder={
                isOrganizer
                  ? "Weekly 5v5 nights, all levels welcome, shirts provided..."
                  : "Tell the squad about yourself — playing style, favourite position, where you're from..."
              }
              maxLength={500}
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center font-body">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-8 w-full bg-rondo-accent text-black font-heading font-black uppercase tracking-widest text-sm py-4 rounded-xl disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Next"}
        </button>
      </form>
    </div>
  );
}
