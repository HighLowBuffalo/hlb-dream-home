"use client";

import { PROGRAM_QUESTIONS, SOUL_QUESTIONS } from "@/lib/data/questions";
import QuestionFlags, { type FlagType } from "./QuestionFlags";

interface FlaggedReviewProps {
  flags: Record<string, Set<FlagType>>;
  programAnswers: Record<string, string>;
  soulAnswers: Record<string, string>;
  onToggleFlag?: (questionKey: string, flag: FlagType) => void;
}

function findQuestion(key: string): { text: string; section: "Program" | "Soul" } | null {
  const p = PROGRAM_QUESTIONS.find((q) => q.key === key);
  if (p) return { text: p.text, section: "Program" };
  const s = SOUL_QUESTIONS.find((q) => q.key === key);
  if (s) return { text: s.text, section: "Soul" };
  return null;
}

export default function FlaggedReview({
  flags,
  programAnswers,
  soulAnswers,
  onToggleFlag,
}: FlaggedReviewProps) {
  const keys = Object.keys(flags).filter((k) => (flags[k]?.size ?? 0) > 0);
  if (keys.length === 0) return null;

  return (
    <div className="mb-10 border-t border-gray-200 pt-8">
      <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-2">
        Items to revisit
      </p>
      <p className="text-sm font-light text-gray-600 leading-relaxed mb-6">
        You flagged these questions as things to come back to or as flexible
        depending on budget. Take another look before you finish.
      </p>
      <div className="space-y-5">
        {keys.map((key) => {
          const q = findQuestion(key);
          if (!q) return null;
          const answer = programAnswers[key] || soulAnswers[key] || "";
          return (
            <div key={key} className="flex gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-1">
                  {q.section}
                </p>
                <p className="text-sm font-light leading-relaxed mb-1">{q.text}</p>
                <p className="text-sm font-light text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {answer ? answer : <span className="italic text-gray-400">No answer yet</span>}
                </p>
              </div>
              <div className="shrink-0 pt-5">
                <QuestionFlags
                  activeFlags={flags[key] || new Set()}
                  onToggle={(flag) => onToggleFlag?.(key, flag)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
