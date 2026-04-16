import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensureProfile";

// GET — list submissions for current user
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("GET /api/submissions error:", error.message, error.code, error.details);
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST — create a new submission
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Safety net: ensure profile exists before creating submission
  const profile = await ensureProfile(user);
  if (!profile.ok) {
    return NextResponse.json(
      { error: "Could not create user profile" },
      { status: 500 }
    );
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      user_id: user.id,
      project_name: body.projectName || null,
      client_name: body.clientName || null,
      address: body.address || null,
      project_type: body.projectType || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
