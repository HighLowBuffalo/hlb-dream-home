import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensureProfile";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const profile = await ensureProfile(user);
        if (!profile.ok) {
          return NextResponse.redirect(`${origin}/login?error=profile`);
        }

        // If no explicit next path, route admins to dashboard
        if (!next) {
          const admin = createAdminClient();
          const { data: profileData } = await admin
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single();

          if (profileData?.is_admin) {
            return NextResponse.redirect(`${origin}/dashboard`);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next || "/welcome"}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
