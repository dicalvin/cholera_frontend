-- =============================================================================
-- Migration 002: Auto-create user_profiles on signup + enable Realtime +
--                Bootstrap admin account + admin_delete_user RPC
-- Run this in: Supabase Dashboard → SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Part 1: Trigger to auto-populate user_profiles when a new auth user is created
-- This runs as postgres (superuser) so it bypasses RLS entirely.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      TRIM(
        COALESCE(NEW.raw_user_meta_data->>'first_name', '') ||
        ' ' ||
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
      )
    ),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'requested_role', 'data_entry'),
    'data_entry',    -- default role (admin upgrades this)
    'pending'        -- always starts as pending
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email          = EXCLUDED.email,
      first_name     = CASE WHEN EXCLUDED.first_name <> '' THEN EXCLUDED.first_name ELSE user_profiles.first_name END,
      last_name      = CASE WHEN EXCLUDED.last_name  <> '' THEN EXCLUDED.last_name  ELSE user_profiles.last_name  END,
      full_name      = CASE WHEN EXCLUDED.full_name  <> '' THEN EXCLUDED.full_name  ELSE user_profiles.full_name  END,
      phone          = COALESCE(EXCLUDED.phone, user_profiles.phone),
      requested_role = COALESCE(EXCLUDED.requested_role, user_profiles.requested_role);
  -- NOTE: role and status are NOT updated by the trigger so admin changes persist

  RETURN NEW;
END;
$$;

-- Drop the trigger first (idempotent) then recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();


-- -----------------------------------------------------------------------------
-- Part 2: Bootstrap the primary admin account (dicalvin17@gmail.com)
-- If the user already exists in auth.users, this upserts their profile row
-- with system_admin role and approved status so they can always log in.
-- -----------------------------------------------------------------------------

INSERT INTO public.user_profiles (id, email, first_name, last_name, full_name, role, status, requested_role)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', 'Calvin'),
  COALESCE(au.raw_user_meta_data->>'last_name',  'Admin'),
  COALESCE(au.raw_user_meta_data->>'full_name',  'Calvin Admin'),
  'system_admin',
  'approved',
  'system_admin'
FROM auth.users au
WHERE au.email = 'dicalvin17@gmail.com'
ON CONFLICT (id) DO UPDATE
  SET
    role   = 'system_admin',
    status = 'approved';


-- -----------------------------------------------------------------------------
-- Part 3: Enable Realtime on cholera_reports so dashboard updates instantly
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_publication_tables
    WHERE  pubname    = 'supabase_realtime'
      AND  schemaname = 'public'
      AND  tablename  = 'cholera_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cholera_reports;
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- Part 4: RLS policies on user_profiles
-- -----------------------------------------------------------------------------

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Each user can read their own row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND schemaname = 'public'
      AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.user_profiles FOR SELECT TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

-- Admins can read all profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND schemaname = 'public'
      AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
      ON public.user_profiles FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid() AND up.role = 'system_admin'
        )
      );
  END IF;
END $$;

-- Admins can update any profile (role / status changes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND schemaname = 'public'
      AND policyname = 'Admins can update profiles'
  ) THEN
    CREATE POLICY "Admins can update profiles"
      ON public.user_profiles FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid() AND up.role = 'system_admin'
        )
      )
      WITH CHECK (true);
  END IF;
END $$;

-- Admins can delete profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND schemaname = 'public'
      AND policyname = 'Admins can delete profiles'
  ) THEN
    CREATE POLICY "Admins can delete profiles"
      ON public.user_profiles FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid() AND up.role = 'system_admin'
        )
      );
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- Part 5: admin_delete_user RPC used by DataAdmin.jsx → deleteUser()
-- Deletes both the profile row and the auth user.
-- SECURITY DEFINER means it runs as the function owner (postgres) so it can
-- touch auth.users even though client JWTs normally can't.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Only allow system_admin callers
  SELECT role INTO caller_role
  FROM public.user_profiles
  WHERE id = auth.uid();

  IF caller_role IS DISTINCT FROM 'system_admin' THEN
    RAISE EXCEPTION 'Permission denied: only system_admin may delete users';
  END IF;

  -- Remove profile row first (FK safe)
  DELETE FROM public.user_profiles WHERE id = target_id;

  -- Remove from Supabase Auth
  DELETE FROM auth.users WHERE id = target_id;
END;
$$;

-- Allow authenticated users to call it (the function itself enforces admin check)
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
