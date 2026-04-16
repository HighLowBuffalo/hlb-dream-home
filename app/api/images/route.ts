import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const submissionId = formData.get("submissionId") as string | null;
  const contextKey = formData.get("contextKey") as string | null;

  if (!file || !submissionId || !contextKey) {
    return NextResponse.json(
      { error: "file, submissionId, and contextKey are required" },
      { status: 400 }
    );
  }

  // Verify user owns submission
  const { data: submission } = await supabase
    .from("submissions")
    .select("id")
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .single();

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const storagePath = `submissions/${submissionId}/${contextKey}/${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("uploads")
    .upload(storagePath, file, { upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Record in database
  const { data, error } = await supabase
    .from("uploaded_images")
    .insert({
      submission_id: submissionId,
      context_key: contextKey,
      context_label: contextKey,
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
