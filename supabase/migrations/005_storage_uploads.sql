-- Migration 005: Private "uploads" bucket + RLS policies for client images
--
-- Path convention enforced by app/api/images/route.ts:
--   submissions/{submissionId}/{contextKey}/{filename}
--
-- storage.foldername(name) returns path segments as a text[]:
--   [1]='submissions', [2]='{submissionId}', [3]='{contextKey}'

-- Create the private bucket (idempotent).
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Clean re-run support.
DROP POLICY IF EXISTS "Users upload to own submission folder" ON storage.objects;
DROP POLICY IF EXISTS "Users read own submission files" ON storage.objects;
DROP POLICY IF EXISTS "Users update own submission files" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own submission files" ON storage.objects;
DROP POLICY IF EXISTS "Admins read all uploads" ON storage.objects;

-- Users may write into submissions/{submissionId}/... only if they own that submission.
CREATE POLICY "Users upload to own submission folder" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'submissions'
  AND EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id::text = (storage.foldername(name))[2]
      AND s.user_id = auth.uid()
  )
);

-- Users may read files under their own submissions.
CREATE POLICY "Users read own submission files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'submissions'
  AND EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id::text = (storage.foldername(name))[2]
      AND s.user_id = auth.uid()
  )
);

-- Users may overwrite (upsert) files under their own submissions.
CREATE POLICY "Users update own submission files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'submissions'
  AND EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id::text = (storage.foldername(name))[2]
      AND s.user_id = auth.uid()
  )
);

-- Users may delete their own files.
CREATE POLICY "Users delete own submission files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = 'submissions'
  AND EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id::text = (storage.foldername(name))[2]
      AND s.user_id = auth.uid()
  )
);

-- Admins may read any uploaded file (uses SECURITY DEFINER function from 004).
CREATE POLICY "Admins read all uploads" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'uploads'
  AND public.is_admin()
);
