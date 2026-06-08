-- Fix: role column should be nullable so new users must complete onboarding

-- 1. Drop the default so DB trigger no longer auto-assigns 'player'
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;

-- 2. Reset role for any user whose profile was created by the trigger
--    but who never completed onboarding (full_name still empty/null)
UPDATE public.profiles
SET role = NULL
WHERE (full_name IS NULL OR TRIM(full_name) = '')
  AND role = 'player';

-- 3. Fix protect_profile_role: gate on NULL role, not NULL full_name.
--    full_name is now set at signup, so the old condition always blocked onboarding.
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND old.role IS DISTINCT FROM new.role THEN
    -- Allow one-time role selection during onboarding (before role is set)
    IF old.role IS NULL AND new.role IN ('player', 'organizer') THEN
      RETURN new;
    END IF;
    new.role := old.role;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
