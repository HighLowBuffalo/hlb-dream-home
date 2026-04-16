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

  return NextResponse.json({
    ...submission.data,
    programAnswers: programAnswers.data || [],
    soulAnswers: soulAnswers.data || [],
    images: images.data || [],
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
