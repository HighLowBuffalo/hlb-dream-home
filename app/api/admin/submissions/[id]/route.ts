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

  return NextResponse.json({
    ...submission.data,
    programAnswers: programAnswers.data || [],
    soulAnswers: soulAnswers.data || [],
    images: images.data || [],
    flags: flags.data || [],
  });
}
