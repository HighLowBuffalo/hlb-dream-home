import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

  // Admins can read all submissions via RLS policy. Join profiles to
  // surface the owner's email in the admin list.
  const { data, error } = await supabase
    .from("submissions")
    .select("*, profiles(email)")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = Record<string, unknown> & { profiles?: { email?: string | null } | null };
  const flattened = (data as Row[]).map(({ profiles, ...rest }) => ({
    ...rest,
    email: profiles?.email ?? null,
  }));

  return NextResponse.json(flattened);
}
