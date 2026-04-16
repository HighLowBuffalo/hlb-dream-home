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

  // Filter to catalog-known keys only. Secondary extractions (e.g.
  // officeLocation, inLawSuiteLocation) are override metadata that
  // don't have their own catalog entries — flagging or uploading
  // against them has no UI meaning and produces duplicate icon rows.
  const catalogKeys = (extractedKeys || []).filter(
    (k) => getQuestion(k) !== undefined
  );
  const primaryKey = catalogKeys[0];
  const uploadableKey = catalogKeys.find(
    (k) => getQuestion(k)?.uploadable === true
  );

  return (
    <div className={`flex flex-col ${isHlb ? "items-start" : "items-end"} mb-4`}>
      <div
        className={`max-w-[80%] px-4 py-3 text-sm font-light leading-relaxed ${
          isHlb ? "bg-gray-100 text-black" : "bg-black text-white"
        }`}
      >
        {text}
      </div>

      {!isHlb && primaryKey && (
        <div className="mt-1 max-w-[80%] flex items-center justify-end gap-2">
          <QuestionFlags
            activeFlags={flags?.[primaryKey] || new Set()}
            onToggle={(flag) => onToggleFlag?.(primaryKey, flag)}
          />
          {uploadableKey && submissionId && (
            <UploadWidget
              contextKey={uploadableKey}
              contextLabel={
                getQuestion(uploadableKey)?.label ||
                getQuestion(uploadableKey)?.text?.slice(0, 40) ||
                uploadableKey
              }
              submissionId={submissionId}
            />
          )}
        </div>
      )}
    </div>
  );
}
