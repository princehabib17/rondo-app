import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fall back to placeholders so the app boots for UI preview without real keys.
// Network calls will fail (expected) but screens render and won't crash on import.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Opt into Supabase Auth passkeys (WebAuthn). Native Face ID / Touch ID
    // still needs a platform authenticator plugin; web builds use the browser API.
    experimental: { passkey: true },
  },
});

export type { Session, User } from '@supabase/supabase-js';
