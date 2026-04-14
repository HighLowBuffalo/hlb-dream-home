"use client";

import { useState, useCallback } from "react";
import ChatInterface from "@/components/chat/ChatInterface";
import SoulView from "@/components/soul/SoulView";

type SaveStatus = "idle" | "saving" | "saved";
type Phase = "program" | "soul";

export default function SurveyPage() {
  const [phase, setPhase] = useState<Phase>("program");
  const [programAnswers, setProgramAnswers] = useState<Record<string, string>>({});
  const [soulAnswers, setSoulAnswers] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const handleProgramAnswer = useCallback((key: string, value: string) => {
    setProgramAnswers((prev) => ({ ...prev, [key]: value }));
    // TODO: autosave to program_answers via API
  }, []);

  const handleSoulSave = useCallback((key: string, value: string) => {
    setSoulAnswers((prev) => ({ ...prev, [key]: value }));
    setSaveStatus("saving");
    // TODO: autosave to soul_answers via API
    setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }, 500);
  }, []);

  const handleProgramComplete = useCallback(() => {
    setPhase("soul");
  }, []);

  const handleSoulComplete = useCallback(() => {
    // TODO: navigate to report page
    // TODO: update submission status to 'completed'
    window.location.href = "/report/placeholder";
  }, []);

  return (
    <div className="flex flex-col h-full">
      {phase === "program" ? (
        <ChatInterface
          answers={programAnswers}
          onAnswer={handleProgramAnswer}
          onComplete={handleProgramComplete}
        />
      ) : (
        <SoulView
          answers={soulAnswers}
          saveStatus={saveStatus}
          onSave={handleSoulSave}
          onComplete={handleSoulComplete}
        />
      )}
    </div>
  );
}
