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

  const [submission, programAnswers, soulAnswers, images] = await Promise.all([
    supabase.from("submissions").select("*").eq("id", id).single(),
    supabase.from("program_answers").select("*").eq("submission_id", id),
    supabase.from("soul_answers").select("*").eq("submission_id", id),
    supabase.from("uploaded_images").select("*").eq("submission_id", id),
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

  const { data, error } = await supabase
    .from("submissions")
    .update({
      project_name: body.projectName,
      client_name: body.clientName,
      address: body.address,
      project_type: body.projectType,
      status: body.status,
      completed_at: body.status === "completed" ? new Date().toISOString() : undefined,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
