"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import FlaggedReview from "@/components/ui/FlaggedReview";
import type { FlagType } from "@/components/ui/QuestionFlags";

/**
 * Renders at the bottom of the chat once the survey is ready to submit.
 *
 * Reveal gate (managed by parent):
 *   - LLM emitted <survey_complete>true</survey_complete>, OR
 *   - Enough non-deferrable questions answered (~80%)
 *
 * Content:
 *   ├─ FlaggedReview (only if any flags exist)
 *   └─ Complete button → PUT submission status=completed → navigate to /report
 */

interface FinalReviewProps {
  submissionId: string;
  programAnswers: Record<string, string>;
  soulAnswers: Record<string, string>;
  flags: Record<string, Set<FlagType>>;
  onToggleFlag?: (questionKey: string, flag: FlagType) => void;
}

export default function FinalReview({
  submissionId,
  programAnswers,
  soulAnswers,
  flags,
  onToggleFlag,
}: FinalReviewProps) {
  const [completing, setCompleting] = useState(false);

  async function handleComplete() {
    setCompleting(true);
    try {
      await fetch(`/api/submissions/${submissionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
    } catch {
      // Non-blocking: answers are already saved. Report still renders.
    }
    window.location.href = `/report/${submissionId}`;
  }

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-2">
          Ready to finish
        </p>
        <p className="text-sm font-light text-gray-600 leading-relaxed mb-6">
          That&apos;s the programming survey. Take one more look at anything
          you flagged, then submit when you&apos;re ready.
        </p>

        <FlaggedReview
          flags={flags}
          programAnswers={programAnswers}
          soulAnswers={soulAnswers}
          onToggleFlag={onToggleFlag}
        />

        <Button
          onClick={handleComplete}
          disabled={completing}
          className="w-full"
        >
          {completing ? "Completing..." : "Complete your vision \u2192"}
        </Button>
      </div>
    </div>
  );
}
