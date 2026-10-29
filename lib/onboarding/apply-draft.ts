import { createClient } from "@/lib/supabase/client";
import {
  clearOnboardingDraft,
  readOnboardingDraft,
  type OnboardingDraft,
} from "@/lib/onboarding/draft";

async function uploadAvatar(userId: string, dataUrl: string) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const path = `${userId}/avatar.jpg`;
  const supabase = createClient();
  const { error } = await supabase.storage.from("avatars").upload(path, blob, {
    upsert: true,
    contentType: "image/jpeg",
  });
  if (error) return null;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

/** Persist pre-auth join draft onto the signed-in profile, then clear the draft. */
export async function applyOnboardingDraft(
  userId: string,
  draft: OnboardingDraft = readOnboardingDraft()
) {
  const supabase = createClient();
  let avatarUrl: string | null = null;
  if (draft.avatarDataUrl) {
    avatarUrl = await uploadAvatar(userId, draft.avatarDataUrl);
  }

  const patch: Record<string, unknown> = {
    role: "player",
  };
  if (draft.username) patch.username = draft.username;
  if (draft.birthdate) patch.date_of_birth = draft.birthdate;
  if (draft.gender) patch.gender = draft.gender;
  if (avatarUrl) patch.avatar_url = avatarUrl;
  if (draft.locationEnabled && draft.lastLat != null && draft.lastLng != null) {
    patch.last_lat = draft.lastLat;
    patch.last_lng = draft.lastLng;
    patch.location_hidden = false;
  }
  if (draft.area.trim()) patch.preferred_areas = draft.area.trim();

  await supabase.from("profiles").update(patch).eq("id", userId);
  clearOnboardingDraft();
}
