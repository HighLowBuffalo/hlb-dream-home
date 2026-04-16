-- Migration 003: Add INSERT policy for profiles
-- Without this, RLS blocks profile creation in auth callback,
-- which cascades to block all submission creation (FK violation).

CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
