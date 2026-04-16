import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfile } from "@/lib/supabase/ensureProfile";

/**
 * DEV-ONLY. Logs in as a known auth.users entry without going through
 * the magic-link email round-trip. Used by local verification tooling
 * (preview_eval) so auth-gated flows can be exercised end-to-end before
 * code ships to Vercel.
 *
 * Gate sequence (ALL must pass; any failure returns 404 with no detail):
 *   1. NODE_ENV === "development"
 *   2. ALLOW_DEV_IMPERSONATE === "1"
 *   3. Host header is localhost / 127.0.0.1
 *
 * Request: POST { email: string }
 * Response (success): 200 { user: { id, email, is_admin } }
 */

function isDevEnabled(request: Request): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  if (process.env.ALLOW_DEV_IMPERSONATE !== "1") return false;
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export async function POST(request: Request) {
  // Triple-gate: fails closed on any missing condition.
  if (!isDevEnabled(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? (body as { email: unknown }).email
      : null;
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json(
      { error: "email (string) is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // 1. Require the user to already exist — we don't auto-create.
  //    listUsers has no direct email filter; page through until we find it
  //    or bail after a reasonable cap for typo-protection.
  const { data: listData, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }
  const targetUser = listData.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (!targetUser) {
    return NextResponse.json(
      { error: `No auth.users row with email ${email}` },
      { status: 404 }
    );
  }

  // 2. Generate a magic-link token for that user.
  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (linkError || !linkData?.properties?.hashed_token) {
    return NextResponse.json(
      { error: linkError?.message || "Failed to generate magic link" },
      { status: 500 }
    );
  }

  // 3. Verify the OTP on the server client so session cookies are
  //    written to the outgoing response via the SSR cookie adapter.
  const supabase = await createClient();
  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp(
    {
      token_hash: linkData.properties.hashed_token,
      type: "email",
    }
  );
  if (verifyError || !verifyData?.user) {
    return NextResponse.json(
      { error: verifyError?.message || "verifyOtp failed" },
      { status: 500 }
    );
  }

  // 4. Make sure the profile row exists so downstream code doesn't choke.
  await ensureProfile(verifyData.user);

  // 5. Sanity: read back via the same cookie adapter. If getUser returns
  //    the expected user, we know the session cookies actually persisted.
  const { data: sanityData } = await supabase.auth.getUser();
  if (!sanityData?.user || sanityData.user.id !== targetUser.id) {
    return NextResponse.json(
      { error: "Session cookies did not persist on response" },
      { status: 500 }
    );
  }

  // 6. Return a compact summary so the caller can verify which role
  //    they just became.
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", targetUser.id)
    .single();

  return NextResponse.json({
    user: {
      id: targetUser.id,
      email: targetUser.email,
      is_admin: Boolean(profile?.is_admin),
    },
  });
}
