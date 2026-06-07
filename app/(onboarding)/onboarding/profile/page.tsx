"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { NATIONALITIES } from "@/lib/utils/format";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name required"),
  age: z.string().min(1, "Age required"),
  gender: z.string().min(1, "Gender required"),
  phone: z.string().min(7, "Phone required"),
  address: z.string().min(2, "Address required"),
  nationality: z.string().min(1, "Nationality required"),
  position: z.string().min(1, "Position required"),
  skill_level: z.string().min(1, "Skill level required"),
  preferred_foot: z.string().min(1, "Preferred foot required"),
  preferred_areas: z.string().min(2, "Preferred areas required"),
  game_preference: z.string().min(1, "Preference required"),
});
type ProfileForm = z.infer<typeof profileSchema>;

const labelClass = "font-heading text-white text-xs uppercase tracking-wider";
const inputClass =
  "w-full bg-[#1c1c1c] border-0 text-white font-body text-sm px-4 py-3.5 rounded-xl placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-rondo-accent/50";

export default function PlayerSetupPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
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

      reset({
        full_name: profileData?.full_name ?? "",
        age: meta.age ?? "",
        gender: meta.gender ?? "",
        phone: meta.phone ?? "",
        address: meta.address ?? "",
        nationality: profileData?.nationality ?? meta.nationality ?? "Philippines",
        position: profileData?.position ?? "",
        skill_level: profileData?.skill_level ?? "",
        preferred_foot: profileData?.preferred_foot ?? "",
        preferred_areas: profileData?.preferred_areas ?? meta.preferred_areas ?? "",
        game_preference: profileData?.game_preference ?? meta.game_preference ?? "",
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

    const role = (sessionStorage.getItem("selectedRole") ?? "player") as "player" | "organizer";

    await supabase.auth.updateUser({
      data: {
        age: data.age,
        gender: data.gender,
        phone: data.phone,
        address: data.address,
        preferred_areas: data.preferred_areas,
        game_preference: data.game_preference,
      },
    });

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        nationality: data.nationality,
        position: data.position,
        skill_level: data.skill_level,
        preferred_foot: data.preferred_foot,
        preferred_areas: data.preferred_areas,
        game_preference: data.game_preference,
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
                // eslint-disable-next-line @next/next/no-img-element
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
          <div className="space-y-2">
            <label className={labelClass}>Full name</label>
            <input {...register("full_name")} placeholder="Miguel Santos" className={inputClass} />
            {errors.full_name && <p className="text-red-400 text-xs font-body">{errors.full_name.message}</p>}
          </div>

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

          <div className="space-y-2">
            <label className={labelClass}>Phone number</label>
            <input {...register("phone")} type="tel" placeholder="0917 123 4567" className={inputClass} />
            {errors.phone && <p className="text-red-400 text-xs font-body">{errors.phone.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className={labelClass}>Address</label>
              <input {...register("address")} placeholder="Taguig City" className={inputClass} />
              {errors.address && <p className="text-red-400 text-xs font-body">{errors.address.message}</p>}
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Nationality</label>
              <select {...register("nationality")} className={inputClass}>
                {NATIONALITIES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {errors.nationality && (
                <p className="text-red-400 text-xs font-body">{errors.nationality.message}</p>
              )}
            </div>
          </div>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className={labelClass}>Preferred foot</label>
              <select {...register("preferred_foot")} className={inputClass}>
                <option value="">Select</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Game preference</label>
              <select {...register("game_preference")} className={inputClass}>
                <option value="">Select</option>
                <option value="football">Football</option>
                <option value="futsal">Futsal</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Preferred areas</label>
            <input {...register("preferred_areas")} placeholder="BGC, Makati, Ortigas" className={inputClass} />
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
