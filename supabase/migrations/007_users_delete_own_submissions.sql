-- Migration 007: allow a user to DELETE their own submission.
--
-- Migration 002 defined SELECT / INSERT / UPDATE policies for
-- submissions but did not define DELETE. Result: /api/submissions/:id
-- DELETE endpoint silently affected 0 rows for non-admin users — RLS
-- filtered the DELETE without raising an error, so the API returned
-- {ok:true} while the row persisted. The "Start over" button in the
-- chat therefore reloaded the page and resumed the same submission
-- instead of creating a fresh one.
--
-- Admins already have DELETE via "Admins full access submissions"
-- (FOR ALL). This policy adds the equivalent for owners of a row.

CREATE POLICY "Users delete own submissions" ON submissions
  FOR DELETE USING (user_id = auth.uid());
