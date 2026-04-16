"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ChatInterface from "@/components/chat/ChatInterface";
import Button from "@/components/ui/Button";
import { getQuestion } from "@/lib/data/questions";
import type { FlagType } from "@/components/ui/QuestionFlags";
import { createClient } from "@/lib/supabase/client";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export type FlagsByKey = Record<string, Set<FlagType>>;

/**
 * Unified chat-driven survey.
 *
 *   ┌── answers (combined) ─────────────────────────────┐
 *   │   keyed by question_key; split at save time via   │
 *   │   the catalog's `table` field into program_answers│
 *   │   or soul_answers.                                │
 *   └───────────────────────────────────────────────────┘
 *
 * The "phase" concept is gone — the LLM handles the program → soul
 * transition as part of the conversation. Completion is managed inside
 * ChatInterface via a Complete button revealed by LLM signal or threshold.
 */
export default function SurveyPage() {
  const router = useRouter();
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const submissionIdRef = useRef<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [programAnswers, setProgramAnswers] = useState<Record<string, string>>({});
  const [soulAnswers, setSoulAnswers] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<FlagsByKey>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    submissionIdRef.current = submissionId;
  }, [submissionId]);

  // On mount: find existing submission or create one.
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/submissions");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          const errBody = await res.json().catch(() => ({}));
          console.error("Survey init: submissions fetch failed", res.status, errBody);
          setInitError(`Could not load your data (${res.status}). Please try signing in again.`);
          return;
        }

        const submissions = await res.json();
        const existing =
          submissions.find((s: { status: string }) => s.status === "in_progress") ||
          (submissions.length > 0 ? submissions[0] : null);

        if (existing) {
          setSubmissionId(existing.id);
          submissionIdRef.current = existing.id;

          const detailRes = await fetch(`/api/submissions/${existing.id}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            const pMap: Record<string, string> = {};
            for (const a of detail.programAnswers) {
              pMap[a.question_key] = a.answer_text || "";
            }
            const sMap: Record<string, string> = {};
            for (const a of detail.soulAnswers) {
              sMap[a.question_key] = a.answer_text || "";
            }
            setProgramAnswers(pMap);
            setSoulAnswers(sMap);
            setAnswers({ ...pMap, ...sMap });

            const loadedFlags: FlagsByKey = {};
            for (const f of detail.flags || []) {
              if (!loadedFlags[f.question_key]) {
                loadedFlags[f.question_key] = new Set<FlagType>();
              }
              loadedFlags[f.question_key].add(f.flag_type as FlagType);
            }
            setFlags(loadedFlags);
          }
        } else {
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
            setInitError("Could not start your session. Please try signing in again.");
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

  // Session heartbeat
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

  /**
   * Single save path for ALL answers. The catalog tells us which table
   * each question_key belongs to — program or soul — so the LLM stays
   * dumb about storage and the UI stays uniform.
   */
  const handleAnswer = useCallback(
    async (key: string, value: string) => {
      const sid = submissionIdRef.current;
      if (!sid) return;

      const q = getQuestion(key);
      // Extracted override keys (e.g. officeLocation) or legacy keys may not
      // appear in the catalog. Default those to "program" so they still save.
      const table = q?.table ?? "program";

      setAnswers((prev) => ({ ...prev, [key]: value }));
      if (table === "soul") {
        setSoulAnswers((prev) => ({ ...prev, [key]: value }));
      } else {
        setProgramAnswers((prev) => ({ ...prev, [key]: value }));
      }

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

        // Propagate metadata fields to the submission row.
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

  const handleToggleFlag = useCallback(
    async (questionKey: string, flagType: FlagType) => {
      const sid = submissionIdRef.current;
      if (!sid) return;

      setFlags((prev) => {
        const next = { ...prev };
        const existing = new Set(next[questionKey] || []);
        if (existing.has(flagType)) existing.delete(flagType);
        else existing.add(flagType);
        if (existing.size === 0) delete next[questionKey];
        else next[questionKey] = existing;
        return next;
      });

      try {
        const res = await fetch("/api/flags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId: sid, questionKey, flagType }),
        });
        if (!res.ok) throw new Error("flag toggle failed");
      } catch {
        // Revert on failure
        setFlags((prev) => {
          const next = { ...prev };
          const existing = new Set(next[questionKey] || []);
          if (existing.has(flagType)) existing.delete(flagType);
          else existing.add(flagType);
          if (existing.size === 0) delete next[questionKey];
          else next[questionKey] = existing;
          return next;
        });
      }
    },
    []
  );

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
          <Button onClick={() => router.push("/login")}>Sign in again</Button>
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
          <Button onClick={() => window.location.reload()}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatInterface
        answers={answers}
        programAnswers={programAnswers}
        soulAnswers={soulAnswers}
        onAnswer={handleAnswer}
        saveStatus={saveStatus}
        submissionId={submissionId}
        flags={flags}
        onToggleFlag={handleToggleFlag}
      />
    </div>
  );
}
