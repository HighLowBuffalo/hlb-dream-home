-- Migration 002: Row Level Security

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE soul_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own; admins see all
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Submissions: users own their submissions; admins see all
CREATE POLICY "Users read own submissions" ON submissions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own submissions" ON submissions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own submissions" ON submissions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins full access submissions" ON submissions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Answers: same pattern — users own theirs
CREATE POLICY "Users manage own program answers" ON program_answers FOR ALL USING (
  EXISTS (SELECT 1 FROM submissions WHERE id = submission_id AND user_id = auth.uid())
);
CREATE POLICY "Admins read all program answers" ON program_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY "Users manage own soul answers" ON soul_answers FOR ALL USING (
  EXISTS (SELECT 1 FROM submissions WHERE id = submission_id AND user_id = auth.uid())
);
CREATE POLICY "Admins read all soul answers" ON soul_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Images: same
CREATE POLICY "Users manage own images" ON uploaded_images FOR ALL USING (
  EXISTS (SELECT 1 FROM submissions WHERE id = submission_id AND user_id = auth.uid())
);
CREATE POLICY "Admins read all images" ON uploaded_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Login history: users read own, admins read all
CREATE POLICY "Users read own login history" ON login_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins read all login history" ON login_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Admin notes: only admins
CREATE POLICY "Admins manage notes" ON admin_notes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
