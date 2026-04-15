"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    async function handleVerify() {
      // If there's a ?code= param, redirect to the server-side callback handler
      const code = searchParams.get("code");
      if (code) {
        router.replace(`/auth/callback?code=${code}`);
        return;
      }

      const supabase = createClient();

      // The hash fragment contains the auth tokens from the magic link
      const { error: authError } = await supabase.auth.getSession();

      if (authError) {
        setError("Something went wrong verifying your link. Please try again.");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Ensure profile exists
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email!,
            last_login: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

        router.replace("/welcome");
      } else {
        setError("Could not verify your session. Please request a new link.");
      }
    }

    handleVerify();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <p className="text-sm font-light text-gray-600">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 text-sm font-light text-black underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <p className="text-sm font-light text-gray-400">Verifying your link...</p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center px-6">
          <p className="text-sm font-light text-gray-400">Verifying your link...</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
