import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import * as q from './queries';

const KEY = 'rondo.onboarding.draft.v1';

export type OnboardingDraft = {
  username: string;
  photoUri: string | null;
  birthdate: string | null; // YYYY-MM-DD
  locationEnabled: boolean;
  lastLat: number | null;
  lastLng: number | null;
  preferredAreas: string;
  notificationsEnabled: boolean;
};

export const EMPTY_DRAFT: OnboardingDraft = {
  username: '',
  photoUri: null,
  birthdate: null,
  locationEnabled: false,
  lastLat: null,
  lastLng: null,
  preferredAreas: '',
  notificationsEnabled: false,
};

/** Ordered pre-auth join steps after welcome slides. */
export const JOIN_STEPS = [
  { id: 'username', path: '/(auth)/onboarding/username', step: 1 },
  { id: 'photo', path: '/(auth)/onboarding/photo', step: 2 },
  { id: 'birthday', path: '/(auth)/onboarding/birthday', step: 3 },
  { id: 'location', path: '/(auth)/onboarding/location', step: 4 },
  { id: 'notifications', path: '/(auth)/onboarding/notifications', step: 5 },
  { id: 'signup', path: '/(auth)/signup', step: 6 },
] as const;

export const JOIN_TOTAL_STEPS = JOIN_STEPS.length;

export async function readOnboardingDraft(): Promise<OnboardingDraft> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_DRAFT };
    return { ...EMPTY_DRAFT, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_DRAFT };
  }
}

export async function writeOnboardingDraft(
  patch: Partial<OnboardingDraft>
): Promise<OnboardingDraft> {
  const next = { ...(await readOnboardingDraft()), ...patch };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function clearOnboardingDraft() {
  await AsyncStorage.removeItem(KEY);
}

async function uploadAvatar(userId: string, uri: string): Promise<string | null> {
  try {
    const res = await fetch(uri);
    const arrayBuffer = await res.arrayBuffer();
    const path = `${userId}/avatar.jpg`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
    if (error) return null;
    return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl ?? null;
  } catch {
    return null;
  }
}

/** Persist pre-auth draft onto the signed-in profile, then clear the draft. */
export async function applyOnboardingDraft(userId: string) {
  const draft = await readOnboardingDraft();
  const patch: Parameters<typeof q.updateProfile>[0] = {
    role: 'player',
  };
  if (draft.username) patch.username = draft.username;
  if (draft.birthdate) patch.date_of_birth = draft.birthdate;
  if (draft.preferredAreas.trim()) patch.preferred_areas = draft.preferredAreas.trim();
  if (draft.locationEnabled && draft.lastLat != null && draft.lastLng != null) {
    patch.last_lat = draft.lastLat;
    patch.last_lng = draft.lastLng;
    patch.location_hidden = false;
  }
  if (draft.photoUri) {
    const avatarUrl = await uploadAvatar(userId, draft.photoUri);
    if (avatarUrl) patch.avatar_url = avatarUrl;
  }
  if (Object.keys(patch).length) {
    await q.updateProfile(patch);
  }
  await clearOnboardingDraft();
}
