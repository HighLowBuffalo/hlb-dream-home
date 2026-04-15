"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatInterface from "@/components/chat/ChatInterface";
import SoulView from "@/components/soul/SoulView";
import { createClient } from "@/lib/supabase/client";

type SaveStatus = "idle" | "saving" | "saved";
type Phase = "program" | "soul";

export default function SurveyPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("program");
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [programAnswers, setProgramAnswers] = useState<Record<string, string>>({});
  const [soulAnswers, setSoulAnswers] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [loading, setLoading] = useState(true);

  // On mount: find existing in-progress submission or create one
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/submissions");
        if (!res.ok) {
          // Not authenticated — redirect to login
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch submissions");
        }

        const submissions = await res.json();
        const inProgress = submissions.find(
          (s: { status: string }) => s.status === "in_progress"
        );

        if (inProgress) {
          setSubmissionId(inProgress.id);
          // Load existing answers
          const detailRes = await fetch(`/api/submissions/${inProgress.id}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            const pAnswers: Record<string, string> = {};
            for (const a of detail.programAnswers) {
              pAnswers[a.question_key] = a.answer_text || "";
            }
            setProgramAnswers(pAnswers);

            const sAnswers: Record<string, string> = {};
            for (const a of detail.soulAnswers) {
              sAnswers[a.question_key] = a.answer_text || "";
            }
            setSoulAnswers(sAnswers);

            // If program is complete, show soul view
            if (Object.keys(sAnswers).length > 0 || Object.keys(pAnswers).length >= 30) {
              setPhase("soul");
            }
          }
        } else {
          // Create new submission
          const createRes = await fetch("/api/submissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          if (createRes.ok) {
            const newSub = await createRes.json();
            setSubmissionId(newSub.id);
          }
        }
      } catch (err) {
        console.error("Survey init error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const saveAnswer = useCallback(
    async (key: string, value: string, table: "program" | "soul" = "program") => {
      if (!submissionId) return;

      setSaveStatus("saving");
      try {
        const res = await fetch("/api/answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId,
            questionKey: key,
            answerText: value,
            table,
          }),
        });

        if (!res.ok) {
          throw new Error("Save failed");
        }

        // Update submission metadata from certain keys
        if (table === "program" && ["name", "address", "projectName", "projectType"].includes(key)) {
          const metaMap: Record<string, string> = {
            name: "clientName",
            address: "address",
            projectName: "projectName",
            projectType: "projectType",
          };
          const field = metaMap[key];
          if (field) {
            await fetch(`/api/submissions/${submissionId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ [field]: value }),
            });
          }
        }

        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } catch {
        setSaveStatus("idle");
      }
    },
    [submissionId]
  );

  const handleProgramAnswer = useCallback(
    (key: string, value: string) => {
      setProgramAnswers((prev) => ({ ...prev, [key]: value }));
      saveAnswer(key, value, "program");
    },
    [saveAnswer]
  );

  const handleSoulSave = useCallback(
    (key: string, value: string) => {
      setSoulAnswers((prev) => ({ ...prev, [key]: value }));
      saveAnswer(key, value, "soul");
    },
    [saveAnswer]
  );

  const handleProgramComplete = useCallback(() => {
    setPhase("soul");
  }, []);

  const handleSoulComplete = useCallback(() => {
    if (!submissionId) return;

    // Fire the status update without awaiting — don't block navigation
    fetch(`/api/submissions/${submissionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    }).catch(() => {});

    // Hard navigation to avoid client-side router hanging on middleware prefetch
    window.location.href = `/report/${submissionId}`;
  }, [submissionId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm font-light text-gray-400">Loading...</p>
      </div>
    );
  }

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
