import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Ensures a profile row exists for the given user.
 * Called from auth callback and as a safety net in submission creation.
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  user: User
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("profiles").upsert(
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
