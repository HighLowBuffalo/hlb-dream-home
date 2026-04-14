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
          Welcome to your Home Vision Tool
        </h1>

        <p className="text-sm font-light text-gray-600 leading-relaxed mb-8 max-w-md mx-auto">
          We're going to walk through two parts together. First, we'll cover the
          practical side — rooms, sizes, how you use your home. Then, we'll get
          into the soul of it — how you want your home to feel. This will take
          about 30 minutes. You can save your progress and come back anytime.
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
