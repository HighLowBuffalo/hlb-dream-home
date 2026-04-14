"use client";

import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();

  // TODO: Check for existing in-progress submission
  const hasExistingSubmission = false;

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

        <div className="flex flex-col gap-3 items-center">
          <Button onClick={() => router.push("/survey")} className="w-64">
            {hasExistingSubmission ? "Continue where you left off" : "Get started"} &rarr;
          </Button>

          {hasExistingSubmission && (
            <Button
              variant="outline"
              onClick={() => {
                // TODO: create new submission
                router.push("/survey");
              }}
              className="w-64"
            >
              Start fresh
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
