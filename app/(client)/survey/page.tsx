"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ChatInterface from "@/components/chat/ChatInterface";
import SoulView from "@/components/soul/SoulView";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type Phase = "program" | "soul";

export default function SurveyPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("program");
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const submissionIdRef = useRef<string | null>(null);
  const [programAnswers, setProgramAnswers] = useState<Record<string, string>>({});
  const [soulAnswers, setSoulAnswers] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Keep ref in sync so callbacks always have latest value
  useEffect(() => {
    submissionIdRef.current = submissionId;
  }, [submissionId]);

  // On mount: find existing submission or create one
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/submissions");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          setInitError("Could not load your data. Please try signing in again.");
          return;
        }

        const submissions = await res.json();

        // Find existing submission: prefer in_progress, fall back to most recent
        const existing =
          submissions.find((s: { status: string }) => s.status === "in_progress") ||
          (submissions.length > 0 ? submissions[0] : null);

        if (existing) {
          setSubmissionId(existing.id);
          submissionIdRef.current = existing.id;

          // Load existing answers
          const detailRes = await fetch(`/api/submissions/${existing.id}`);
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

            if (Object.keys(sAnswers).length > 0 || Object.keys(pAnswers).length >= 30) {
              setPhase("soul");
            }
          }
        } else {
          // No submissions — create a new one
          const createRes = await fetch("/api/submissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          if (createRes.ok) {
            const newSub = await createRes.json();
            setSubmissionId(newSub.id);
            submissionIdRef.current = newSub.id;
          } else {
            const err = await createRes.json().catch(() => ({}));
            console.error("Failed to create submission:", err);
            setInitError(
              "Could not start your session. Please try signing in again."
            );
          }
        }
      } catch (err) {
        console.error("Survey init error:", err);
        setInitError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  // Session heartbeat: check every 5 minutes that the session is still valid
  useEffect(() => {
    const interval = setInterval(async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setInitError("Your session has expired. Please sign in again.");
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const saveAnswer = useCallback(
    async (key: string, value: string, table: "program" | "soul" = "program") => {
      const sid = submissionIdRef.current;
      if (!sid) return;

      setSaveStatus("saving");
      try {
        const res = await fetch("/api/answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId: sid,
            questionKey: key,
            answerText: value,
            table,
          }),
        });

        if (!res.ok) {
          setSaveStatus("error");
          return;
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
            fetch(`/api/submissions/${sid}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ [field]: value }),
            }).catch(() => {});
          }
        }

        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } catch {
        setSaveStatus("error");
      }
    },
    []
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

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm font-light text-gray-400">Loading...</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <p className="text-sm font-light text-gray-600 mb-6">{initError}</p>
          <Button onClick={() => router.push("/login")}>
            Sign in again
          </Button>
        </div>
      </div>
    );
  }

  if (!submissionId) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <p className="text-sm font-light text-gray-600 mb-6">
            Something went wrong setting up your session.
          </p>
          <Button onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
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
          saveStatus={saveStatus}
          submissionId={submissionId}
        />
      ) : (
        <SoulView
          answers={soulAnswers}
          saveStatus={saveStatus}
          onSave={handleSoulSave}
          submissionId={submissionId}
        />
      )}
    </div>
  );
}
