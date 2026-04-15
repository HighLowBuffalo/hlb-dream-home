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
  onComplete?: () => void;
}

export default function SoulView({
  answers = {},
  saveStatus = "idle",
  onSave,
  onComplete,
}: SoulViewProps) {
  const [completing, setCompleting] = useState(false);
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
            These questions aren't about square footage or room counts. They're
            about how you want to feel in your home. There are no right answers
            — just honest ones. Answer as many as you'd like, in whatever order
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
            onClick={() => {
              setCompleting(true);
              onComplete?.();
            }}
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
