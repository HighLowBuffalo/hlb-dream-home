import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "./admin";

/**
 * Ensures a profile row exists for the given user.
 * Uses the service role client to bypass RLS — profile creation
 * is a system-level operation that must always succeed.
 */
export async function ensureProfile(
  user: User
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();

  const { error } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email!,
      last_login: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("ensureProfile failed:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
