import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type FlagType = "revisit" | "flexible";

async function getUserAndVerifyOwnership(submissionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, owns: false };
  }

  const { data: submission } = await supabase
    .from("submissions")
    .select("id")
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .single();

  return { supabase, user, owns: Boolean(submission) };
}

// GET — list flags for a submission
export async function GET(request: Request) {
  const url = new URL(request.url);
  const submissionId = url.searchParams.get("submissionId");
  if (!submissionId) {
    return NextResponse.json(
      { error: "submissionId is required" },
      { status: 400 }
    );
  }

  const { supabase, user, owns } = await getUserAndVerifyOwnership(submissionId);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!owns) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("question_flags")
    .select("question_key, flag_type")
    .eq("submission_id", submissionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ flags: data || [] });
}

// POST — toggle a flag (insert if missing, delete if present). Returns new state.
export async function POST(request: Request) {
  const body = await request.json();
  const { submissionId, questionKey, flagType } = body as {
    submissionId?: string;
    questionKey?: string;
    flagType?: FlagType;
  };

  if (!submissionId || !questionKey || !flagType) {
    return NextResponse.json(
      { error: "submissionId, questionKey, and flagType are required" },
      { status: 400 }
    );
  }
  if (flagType !== "revisit" && flagType !== "flexible") {
    return NextResponse.json({ error: "Invalid flagType" }, { status: 400 });
  }

  const { supabase, user, owns } = await getUserAndVerifyOwnership(submissionId);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!owns) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  // Check current state
  const { data: existing } = await supabase
    .from("question_flags")
    .select("id")
    .eq("submission_id", submissionId)
    .eq("question_key", questionKey)
    .eq("flag_type", flagType)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("question_flags")
      .delete()
      .eq("id", existing.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ active: false });
  }

  const { error } = await supabase.from("question_flags").insert({
    submission_id: submissionId,
    question_key: questionKey,
    flag_type: flagType,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ active: true });
}
