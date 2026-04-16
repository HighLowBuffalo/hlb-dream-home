import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [submission, programAnswers, soulAnswers, images, flags] = await Promise.all([
    supabase.from("submissions").select("*").eq("id", id).single(),
    supabase.from("program_answers").select("*").eq("submission_id", id),
    supabase.from("soul_answers").select("*").eq("submission_id", id),
    supabase.from("uploaded_images").select("*").eq("submission_id", id),
    supabase.from("question_flags").select("question_key, flag_type").eq("submission_id", id),
  ]);

  if (submission.error) {
    return NextResponse.json(
      { error: submission.error.message },
      { status: 404 }
    );
  }

  const imageRows = images.data || [];
  let signedImages: Array<Record<string, unknown>> = imageRows;
  if (imageRows.length > 0) {
    const paths = imageRows.map((r) => r.storage_path);
    const { data: signed } = await supabase.storage
      .from("uploads")
      .createSignedUrls(paths, 60 * 60); // 1 hour
    const urlByPath = new Map<string, string>();
    for (const s of signed || []) {
      if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
    }
    signedImages = imageRows.map((r) => ({
      ...r,
      signed_url: urlByPath.get(r.storage_path) || null,
    }));
  }

  return NextResponse.json({
    ...submission.data,
    programAnswers: programAnswers.data || [],
    soulAnswers: soulAnswers.data || [],
    images: signedImages,
    flags: flags.data || [],
  });
}

// DELETE — admin removes a submission. RLS "Admins full access submissions"
// (FOR ALL) permits the delete; cascades clean up program_answers,
// soul_answers, question_flags, and uploaded_images. Storage objects in the
// "uploads" bucket are orphaned — acceptable, same tradeoff as the user
// start-over delete in /api/submissions/[id].
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // select("id") so an RLS-filtered delete surfaces as 404 instead of a
  // silent {ok:true}.
  const { data: deleted, error } = await supabase
    .from("submissions")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
