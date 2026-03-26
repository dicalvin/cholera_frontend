-- =============================================================================
-- Migration: Fix infinite recursion in user_profiles RLS policies
-- Run this in: Supabase Dashboard -> SQL Editor
-- =============================================================================

BEGIN;

-- Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Helper used by policies so they do not query user_profiles recursively
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Prevent policy re-entry when this function checks user_profiles
  PERFORM set_config('row_security', 'off', true);

  SELECT up.role
  INTO v_role
  FROM public.user_profiles up
  WHERE up.id = auth.uid()
  LIMIT 1;

  RETURN v_role = 'system_admin';
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_system_admin() TO authenticated;

-- Drop any old recursive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;

-- Recreate non-recursive policies
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_system_admin());

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update profiles"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_system_admin())
  WITH CHECK (true);

CREATE POLICY "Admins can delete profiles"
  ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (public.is_system_admin());

-- Backfill any missing profile rows so admins can see existing auth users
INSERT INTO public.user_profiles (
  id,
  email,
  first_name,
  last_name,
  full_name,
  phone,
  requested_role,
  role,
  status
)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', ''),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  NULLIF(
    COALESCE(
      au.raw_user_meta_data->>'full_name',
      TRIM(
        COALESCE(au.raw_user_meta_data->>'first_name', '') || ' ' ||
        COALESCE(au.raw_user_meta_data->>'last_name', '')
      )
    ),
    ''
  ),
  NULLIF(au.raw_user_meta_data->>'phone', ''),
  CASE
    WHEN (au.raw_user_meta_data->>'requested_role') IN ('data_entry', 'epidemiologist', 'surveillance', 'data_manager', 'system_admin')
      THEN (au.raw_user_meta_data->>'requested_role')::public.user_role
    ELSE 'data_entry'::public.user_role
  END,
  'data_entry',
  'pending'
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE up.id IS NULL;

COMMIT;
