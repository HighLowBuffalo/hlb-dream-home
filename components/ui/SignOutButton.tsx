"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Full navigation so all server components re-read auth state.
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      // Positioning is handled by the TopRightPills wrapper so SAVED and
      // SIGN OUT share a single fixed flex row instead of fighting for
      // the same corner.
      className="bg-white border border-gray-200 px-3 py-1 text-[10px] font-medium tracking-[0.18em] uppercase text-gray-600 hover:text-black hover:border-black transition-colors"
    >
      Sign out
    </button>
  );
}
