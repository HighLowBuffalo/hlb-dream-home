import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST — upsert a single answer (autosave)
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { submissionId, questionKey, answerText, answerData, table } = body;

  if (!submissionId || !questionKey) {
    return NextResponse.json(
      { error: "submissionId and questionKey are required" },
      { status: 400 }
    );
  }

  // Verify user owns this submission
  const { data: submission } = await supabase
    .from("submissions")
    .select("id")
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .single();

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const targetTable = table === "soul" ? "soul_answers" : "program_answers";

  const upsertData =
    targetTable === "program_answers"
      ? {
          submission_id: submissionId,
          question_key: questionKey,
          answer_text: answerText || null,
          answer_data: answerData || null,
        }
      : {
          submission_id: submissionId,
          question_key: questionKey,
          answer_text: answerText || null,
        };

  const { data, error } = await supabase
    .from(targetTable)
    .upsert(upsertData, {
      onConflict: "submission_id,question_key",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
