import { createClient } from "@/lib/supabase/client";

export type UploadResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Upload an image directly from the browser to Supabase Storage
 * (bypassing Vercel's 4.5 MB serverless body limit), then record the
 * metadata via /api/images.
 *
 * Storage RLS (migration 005) enforces that the signed-in user can
 * only write under submissions/{theirSubmissionId}/...
 */
export async function uploadImage(
  file: File,
  submissionId: string,
  contextKey: string
): Promise<UploadResult> {
  const supabase = createClient();
  const storagePath = `submissions/${submissionId}/${contextKey}/${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("uploads")
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type || undefined,
    });
  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const res = await fetch("/api/images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      submissionId,
      contextKey,
      storagePath,
      fileName: file.name,
      fileSize: file.size,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.error || "metadata save failed" };
  }
  return { ok: true };
}
