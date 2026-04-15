"use client";

import { useState } from "react";
import { SOUL_QUESTIONS } from "@/lib/data/soulQuestions";
import SoulQuestion from "./SoulQuestion";
import Button from "@/components/ui/Button";
import SaveIndicator from "@/components/ui/SaveIndicator";

type SaveStatus = "idle" | "saving" | "saved";

interface SoulViewProps {
  answers?: Record<string, string>;
  saveStatus?: SaveStatus;
  onSave?: (key: string, value: string) => void;
  submissionId?: string | null;
}

export default function SoulView({
  answers = {},
  saveStatus = "idle",
  onSave,
  submissionId,
}: SoulViewProps) {
  const [completing, setCompleting] = useState(false);

  function handleComplete() {
    setCompleting(true);

    // Try to mark as completed, but don't let it block navigation
    if (submissionId) {
      fetch(`/api/submissions/${submissionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      }).catch(() => {});
    }

    // Navigate no matter what — use setTimeout to ensure state update renders first
    setTimeout(() => {
      const target = submissionId
        ? `/report/${submissionId}`
        : "/welcome";
      window.location.href = target;
    }, 100);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400">
          The Soul of Your Home
        </p>
        <SaveIndicator status={saveStatus} />
      </div>

      {/* Questions */}
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-2xl mx-auto w-full">
        <div className="mb-10">
          <h2 className="text-2xl font-light mb-3">
            Now for the part that matters most.
          </h2>
          <p className="text-sm font-light text-gray-600 leading-relaxed">
            These questions aren&apos;t about square footage or room counts. They&apos;re
            about how you want to feel in your home. There are no right answers
            — just honest ones. Answer as many as you&apos;d like, in whatever order
            feels right.
          </p>
        </div>

        {SOUL_QUESTIONS.map((q) => (
          <SoulQuestion
            key={q.key}
            question={q}
            initialValue={answers[q.key] || ""}
            onSave={onSave}
          />
        ))}

        <div className="py-8 border-t border-gray-200">
          <Button
            onClick={handleComplete}
            disabled={completing}
            className="w-full"
          >
            {completing ? "Completing..." : "Complete your vision \u2192"}
          </Button>
        </div>
      </div>
    </div>
  );
}
