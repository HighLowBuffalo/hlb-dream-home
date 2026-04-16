"use client";

import QuestionFlags, { type FlagType } from "@/components/ui/QuestionFlags";
import { getQuestion } from "@/lib/data/questions";
import UploadWidget from "./UploadWidget";

interface MessageProps {
  sender: "hlb" | "user";
  text: string;
  /** question_keys the LLM extracted from this turn. */
  extractedKeys?: string[];
  flags?: Record<string, Set<FlagType>>;
  onToggleFlag?: (questionKey: string, flag: FlagType) => void;
  submissionId?: string;
}

export default function Message({
  sender,
  text,
  extractedKeys,
  flags,
  onToggleFlag,
  submissionId,
}: MessageProps) {
  const isHlb = sender === "hlb";
  const hasExtractions = !isHlb && extractedKeys && extractedKeys.length > 0;

  // Uploadable keys are the subset of extractedKeys whose catalog entry has
  // uploadable: true — the UI shows an "Add image" button scoped to that
  // question_key so the upload lands at submissions/<id>/<key>/...
  const uploadableKeys = hasExtractions
    ? extractedKeys!.filter((k) => getQuestion(k)?.uploadable)
    : [];

  return (
    <div className={`flex flex-col ${isHlb ? "items-start" : "items-end"} mb-4`}>
      <div
        className={`max-w-[80%] px-4 py-3 text-sm font-light leading-relaxed ${
          isHlb ? "bg-gray-100 text-black" : "bg-black text-white"
        }`}
      >
        {text}
      </div>

      {hasExtractions && (
        <div className="mt-1 max-w-[80%] flex flex-col items-end gap-1">
          {extractedKeys!.map((key) => {
            const q = getQuestion(key);
            const label = q?.label || q?.text?.slice(0, 40) || key;
            return (
              <div key={key} className="flex items-center gap-2">
                <QuestionFlags
                  activeFlags={flags?.[key] || new Set()}
                  onToggle={(flag) => onToggleFlag?.(key, flag)}
                />
                {uploadableKeys.includes(key) && submissionId && (
                  <UploadWidget
                    contextKey={key}
                    contextLabel={label}
                    submissionId={submissionId}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
