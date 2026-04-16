"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function WelcomePage() {
  const router = useRouter();
  const [hasExisting, setHasExisting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkExisting() {
      try {
        const res = await fetch("/api/submissions");
        if (res.ok) {
          const submissions = await res.json();
          const inProgress = submissions.find(
            (s: { status: string }) => s.status === "in_progress"
          );
          setHasExisting(!!inProgress);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    checkExisting();
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-lg text-center">
        <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-6">
          High, Low, Buffalo
        </p>

        <h1 className="text-3xl font-light leading-tight mb-4">
          Let's plan your dream home
        </h1>

        <p className="text-sm font-light text-gray-600 leading-relaxed mb-8 max-w-md mx-auto">
          This is the first step in your design journey — what architects call
          programming. We'll talk through the practical side (rooms, spaces, how
          you use your home) and the personal side (how you want it to feel).
          Take about 30 minutes, or stop anytime and come back later.
        </p>

        {loading ? (
          <p className="text-sm font-light text-gray-400">Loading...</p>
        ) : (
          <div className="flex flex-col gap-3 items-center">
            <Button onClick={() => router.push("/survey")} className="w-64">
              {hasExisting ? "Continue where you left off" : "Get started"}{" "}
              &rarr;
            </Button>

            {hasExisting && (
              <Button
                variant="outline"
                onClick={() => router.push("/survey?new=true")}
                className="w-64"
              >
                Start fresh
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
