import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Record metadata for an image that the browser has already uploaded
 * directly to Supabase Storage. The file itself is NOT sent through
 * this route — direct-to-Storage uploads bypass Vercel's 4.5 MB
 * serverless body limit.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { submissionId, contextKey, storagePath, fileName, fileSize } = body as {
    submissionId?: string;
    contextKey?: string;
    storagePath?: string;
    fileName?: string;
    fileSize?: number;
  };

  if (!submissionId || !contextKey || !storagePath || !fileName) {
    return NextResponse.json(
      { error: "submissionId, contextKey, storagePath, and fileName are required" },
      { status: 400 }
    );
  }

  // Defensive: ensure the recorded path matches the enforced pattern so
  // a user can't attach someone else's file to their own submission row.
  const expectedPrefix = `submissions/${submissionId}/${contextKey}/`;
  if (!storagePath.startsWith(expectedPrefix)) {
    return NextResponse.json(
      { error: "storagePath does not match submissionId/contextKey" },
      { status: 400 }
    );
  }

  const { data: submission } = await supabase
    .from("submissions")
    .select("id")
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .single();

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("uploaded_images")
    .insert({
      submission_id: submissionId,
      context_key: contextKey,
      context_label: contextKey,
      storage_path: storagePath,
      file_name: fileName,
      file_size: fileSize ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
