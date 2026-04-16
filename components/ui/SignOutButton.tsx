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
      // Pill treatment (bg + border) keeps the label legible when the
      // underlying header has its own text at the same corner — otherwise
      // it visually collides with the progress bar / header content.
      className="fixed top-3 right-4 z-50 bg-white border border-gray-200 px-3 py-1 text-[10px] font-medium tracking-[0.18em] uppercase text-gray-600 hover:text-black hover:border-black transition-colors"
    >
      Sign out
    </button>
  );
}
