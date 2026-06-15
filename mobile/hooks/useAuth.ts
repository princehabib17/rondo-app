import { useEffect, useState, useCallback } from 'react';
import { supabase, type Session, type User } from '../lib/supabase';
import type { Profile } from '../lib/types';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string | undefined) => {
    if (!uid) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    setProfile((data as Profile) ?? null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      await loadProfile(session?.user?.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      await loadProfile(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signOut = () => supabase.auth.signOut();
  const refreshProfile = () => loadProfile(user?.id);

  return { session, user, profile, role: profile?.role ?? null, loading, signOut, refreshProfile };
}
