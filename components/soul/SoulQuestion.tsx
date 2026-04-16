"use client";

import { useState, useEffect, useRef } from "react";
import Textarea from "@/components/ui/Textarea";
import SoulUploadBtn from "./SoulUploadBtn";
import type { SoulQuestion as SoulQuestionType } from "@/lib/data/soulQuestions";

interface SoulQuestionProps {
  question: SoulQuestionType;
  initialValue?: string;
  onSave?: (key: string, value: string) => void;
  submissionId?: string;
}

export default function SoulQuestion({
  question,
  initialValue = "",
  onSave,
  submissionId,
}: SoulQuestionProps) {
  const [value, setValue] = useState(initialValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  function handleChange(text: string) {
    setValue(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (text.trim()) {
        onSave?.(question.key, text);
      }
    }, 500);
  }

  return (
    <div className="mb-10">
      <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-2">
        {question.label}
      </p>
      <p className="text-xl font-light leading-relaxed mb-4">{question.q}</p>
      <Textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Take your time with this one..."
        rows={4}
      />
      <div className="mt-2">
        <SoulUploadBtn contextKey={question.key} submissionId={submissionId} />
      </div>
    </div>
  );
}
