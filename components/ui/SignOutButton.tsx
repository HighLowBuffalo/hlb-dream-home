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
      className="fixed top-4 right-6 z-50 text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 hover:text-black transition-colors"
    >
      Sign out
    </button>
  );
}
