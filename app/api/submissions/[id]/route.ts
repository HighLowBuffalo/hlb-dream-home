import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — fetch single submission with all answers
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

  // Sign URLs for the private uploads bucket so the client can render thumbnails.
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

// PUT — update submission metadata
export async function PUT(
  request: Request,
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

  const body = await request.json();

  // Only include fields that were actually sent to avoid wiping existing data
  const updateData: Record<string, unknown> = {};
  if (body.projectName !== undefined) updateData.project_name = body.projectName;
  if (body.clientName !== undefined) updateData.client_name = body.clientName;
  if (body.address !== undefined) updateData.address = body.address;
  if (body.projectType !== undefined) updateData.project_type = body.projectType;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.status === "completed") updateData.completed_at = new Date().toISOString();
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("submissions")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE — user initiates a "start over" on their own submission.
// RLS scopes to rows where user_id = auth.uid(); cascades clean up
// program_answers, soul_answers, question_flags, and uploaded_images.
// Storage objects are orphaned (acceptable — small, and cleaned up
// when user re-uploads under the same key on the new submission).
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

  // .select() on a DELETE returns the deleted rows. If RLS filters the
  // row out (e.g. missing DELETE policy) Postgres doesn't raise an error
  // — it just affects 0 rows. Without this check we'd return {ok:true}
  // on a silent failure, which is exactly how the "Start over" button
  // was previously lying to clients.
  const { data: deleted, error } = await supabase
    .from("submissions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!deleted || deleted.length === 0) {
    return NextResponse.json(
      { error: "Submission not found or not deletable by this user" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, deleted: deleted.length });
}
