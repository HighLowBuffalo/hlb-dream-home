-- Migration 004: Fix infinite recursion in admin RLS policies
--
-- The admin policy on profiles referenced profiles itself, causing
-- "infinite recursion detected in policy for relation profiles"
-- whenever any RLS-protected query touched the profiles table.
--
-- Fix: use a SECURITY DEFINER function that bypasses RLS to check
-- the is_admin flag, breaking the recursion.

-- Create the helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Drop all recursive admin policies
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins full access submissions" ON submissions;
DROP POLICY IF EXISTS "Admins read all program answers" ON program_answers;
DROP POLICY IF EXISTS "Admins read all soul answers" ON soul_answers;
DROP POLICY IF EXISTS "Admins read all images" ON uploaded_images;
DROP POLICY IF EXISTS "Admins read all login history" ON login_history;
DROP POLICY IF EXISTS "Admins manage notes" ON admin_notes;

-- Recreate using the safe function
CREATE POLICY "Admins read all profiles" ON profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins full access submissions" ON submissions FOR ALL USING (public.is_admin());
CREATE POLICY "Admins read all program answers" ON program_answers FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins read all soul answers" ON soul_answers FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins read all images" ON uploaded_images FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins read all login history" ON login_history FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins manage notes" ON admin_notes FOR ALL USING (public.is_admin());
