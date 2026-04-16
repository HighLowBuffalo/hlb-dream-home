-- Migration 006: question_flags — "come back to this" / "flexible depending on budget"
--
-- Users attach flags to specific questions (by question_key). Flags exist
-- independently of the answer row, so a user can flag a question they
-- haven't answered yet ("not sure yet" is itself a flag signal).

CREATE TABLE question_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  flag_type TEXT NOT NULL CHECK (flag_type IN ('revisit', 'flexible')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (submission_id, question_key, flag_type)
);

CREATE INDEX question_flags_submission_idx ON question_flags (submission_id);

ALTER TABLE question_flags ENABLE ROW LEVEL SECURITY;

-- Users manage their own flags.
CREATE POLICY "Users manage own flags" ON question_flags FOR ALL USING (
  EXISTS (SELECT 1 FROM submissions WHERE id = submission_id AND user_id = auth.uid())
);

-- Admins can read all flags.
CREATE POLICY "Admins read all flags" ON question_flags FOR SELECT USING (
  public.is_admin()
);
