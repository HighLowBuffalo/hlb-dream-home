"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { QUESTIONS, getQuestion } from "@/lib/data/questions";
import Message from "./Message";
import TypingIndicator from "./TypingIndicator";
import FinalReview from "./FinalReview";
import QuickReplies from "./QuickReplies";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import SaveIndicator from "@/components/ui/SaveIndicator";
import type { FlagType } from "@/components/ui/QuestionFlags";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface ChatMessage {
  id: string;
  sender: "hlb" | "user";
  text: string;
  /** question_keys the LLM extracted from this turn — used for flag + upload UI. */
  extractedKeys?: string[];
}

interface ApiMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  /** Combined program + soul answers keyed by question_key. */
  answers?: Record<string, string>;
  onAnswer?: (key: string, value: string) => void;
  saveStatus?: SaveStatus;
  submissionId: string;
  programAnswers?: Record<string, string>;
  soulAnswers?: Record<string, string>;
  flags?: Record<string, Set<FlagType>>;
  onToggleFlag?: (questionKey: string, flag: FlagType) => void;
}

// Non-deferrable count drives the "threshold" path to revealing the Complete
// button even if the LLM forgets to emit <survey_complete>.
const NON_DEFERRABLE_COUNT = QUESTIONS.filter((q) => !q.deferrable).length;
const COMPLETION_THRESHOLD = 0.8;

/**
 * Parse LLM tags out of a response:
 *   <current_question key="X"/>     → which question the LLM is asking (drives chip UI)
 *   <answer key="X">Y</answer>       → extractable facts to save
 *   <survey_complete>true</survey_complete> → ready-to-submit signal
 *
 * Returns display text with all tags stripped.
 */
function parseResponse(text: string): {
  displayText: string;
  answers: { key: string; value: string }[];
  currentQuestionKey: string | null;
  isComplete: boolean;
} {
  const answers: { key: string; value: string }[] = [];
  const answerRegex = /<answer key="([^"]+)">([^<]*)<\/answer>/g;
  let match;
  while ((match = answerRegex.exec(text)) !== null) {
    answers.push({ key: match[1], value: match[2].trim() });
  }

  const currentQuestionMatch = text.match(
    /<current_question key="([^"]+)"\s*\/?>/
  );
  const currentQuestionKey =
    currentQuestionMatch && currentQuestionMatch[1] !== "none"
      ? currentQuestionMatch[1]
      : null;

  const isComplete = text.includes("<survey_complete>true</survey_complete>");

  const displayText = text
    .replace(/<current_question key="[^"]+"\s*\/?>/g, "")
    .replace(/<answer key="[^"]+">([^<]*)<\/answer>/g, "")
    .replace(/<survey_complete>true<\/survey_complete>/g, "")
    .trim();

  return { displayText, answers, currentQuestionKey, isComplete };
}

export default function ChatInterface({
  answers: initialAnswers = {},
  onAnswer,
  saveStatus = "idle",
  submissionId,
  programAnswers = {},
  soulAnswers = {},
  flags,
  onToggleFlag,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [apiMessages, setApiMessages] = useState<ApiMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [answeredKeys, setAnsweredKeys] = useState<Set<string>>(
    new Set(Object.keys(initialAnswers))
  );
  const [llmSignaledComplete, setLlmSignaledComplete] = useState(false);
  const [currentQuestionKey, setCurrentQuestionKey] = useState<string | null>(
    null
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const initRef = useRef(false);

  // Count only non-deferrable questions toward progress to keep the meter honest.
  const answeredNonDeferrable = [...answeredKeys].filter((k) => {
    const q = getQuestion(k);
    return q && !q.deferrable;
  }).length;
  const coverage = answeredNonDeferrable / NON_DEFERRABLE_COUNT;
  const canComplete = llmSignaledComplete || coverage >= COMPLETION_THRESHOLD;

  // Scroll to bottom on new messages.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping, canComplete]);

  // Refocus the input whenever the assistant stops typing — fixes the
  // per-turn friction the user flagged in the PDF.
  useEffect(() => {
    if (!isTyping) inputRef.current?.focus();
  }, [isTyping]);

  const sendToApi = useCallback(
    async (newApiMessages: ApiMessage[]) => {
      setIsTyping(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newApiMessages }),
        });
        if (!res.ok) throw new Error("Chat API failed");

        const data = await res.json();
        const { displayText, answers, currentQuestionKey: nextKey, isComplete } =
          parseResponse(data.text);

        setCurrentQuestionKey(nextKey);

        // Save extracted answers (parent routes to correct DB table via catalog).
        for (const { key, value } of answers) {
          onAnswer?.(key, value);
          setAnsweredKeys((prev) => new Set([...prev, key]));
        }

        // Attach extracted keys to the most recent user message so the UI
        // can show flag + upload controls under it.
        if (answers.length > 0) {
          const newKeys = answers.map((a) => a.key);
          setMessages((prev) => {
            const copy = [...prev];
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].sender === "user") {
                const merged = Array.from(
                  new Set([...(copy[i].extractedKeys || []), ...newKeys])
                );
                copy[i] = { ...copy[i], extractedKeys: merged };
                break;
              }
            }
            return copy;
          });
        }

        setMessages((prev) => [
          ...prev,
          { id: `hlb-${Date.now()}`, sender: "hlb", text: displayText },
        ]);
        setApiMessages((prev) => [
          ...prev,
          { role: "assistant" as const, content: data.text },
        ]);

        if (isComplete) setLlmSignaledComplete(true);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            sender: "hlb",
            text: "Sorry, I had trouble processing that. Could you try again?",
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [onAnswer]
  );

  // Kick off the conversation. On resume, summarize prior answers.
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Only include keys that exist in the current catalog. Renamed or
    // deleted keys (e.g. the old soul "guests" → now "soulGuests", or
    // "site" which we removed) would otherwise poison the recap and can
    // cause the LLM to respond with garbage.
    const resumeKeys = Object.keys(initialAnswers).filter(
      (k) => getQuestion(k) !== undefined
    );
    let startMessage: ApiMessage;

    if (resumeKeys.length > 0) {
      const summary = resumeKeys
        .map((key) => {
          const q = getQuestion(key);
          return `${q?.text || key}: ${initialAnswers[key]}`;
        })
        .join("\n");

      startMessage = {
        role: "user",
        content: `I'm returning to continue the questionnaire. Here's what I've already answered:\n\n${summary}\n\nLet's pick up where we left off.`,
      };

      setMessages([
        {
          id: "resume-user",
          sender: "user",
          text: "I'd like to pick up where I left off.",
        },
      ]);
    } else {
      startMessage = {
        role: "user",
        content: "Hi, I'm ready to start the home programming questionnaire.",
      };

      setMessages([
        {
          id: "start-user",
          sender: "user",
          text: "I'm ready to get started.",
        },
      ]);
    }

    const newApiMessages = [startMessage];
    setApiMessages(newApiMessages);
    sendToApi(newApiMessages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue.trim();
    setInputValue("");

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: "user", text: userText },
    ]);

    const newApiMessages = [
      ...apiMessages,
      { role: "user" as const, content: userText },
    ];
    setApiMessages(newApiMessages);
    sendToApi(newApiMessages);
  }

  // Look up the catalog entry for the question the LLM is currently asking.
  // Drives chip rendering + input placeholder hint.
  const currentQuestion = currentQuestionKey
    ? getQuestion(currentQuestionKey)
    : null;
  const showChips =
    !!currentQuestion &&
    (currentQuestion.type === "chips_single" ||
      currentQuestion.type === "chips_multi") &&
    (currentQuestion.quickReplies?.length ?? 0) > 0 &&
    !isTyping;

  // Parse the current input as a comma-separated list for chips_multi so
  // chip toggling is additive / subtractive with what's already typed.
  function currentSelections(): string[] {
    return inputValue
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function handleChipClick(chipValue: string) {
    if (!currentQuestion) return;

    if (currentQuestion.type === "chips_single") {
      // One tap sends — fastest UX for mutually-exclusive options.
      setInputValue(chipValue);
      // Submit on next tick so React flushes the state first.
      setTimeout(() => formRef.current?.requestSubmit(), 0);
    } else if (currentQuestion.type === "chips_multi") {
      // Toggle in the current selection; user hits Send when done.
      const selected = currentSelections();
      const idx = selected.indexOf(chipValue);
      if (idx >= 0) selected.splice(idx, 1);
      else selected.push(chipValue);
      setInputValue(selected.join(", "));
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header — leaves pr-28 on the right so the fixed SIGN OUT pill
          doesn't overlap the SaveIndicator or the Start-over link. The
          label is dropped in favor of the bar+counter alone; context is
          obvious since the user is on the survey page. */}
      <div className="flex items-center justify-between pl-6 pr-28 py-4 border-b border-gray-200 gap-4">
        <div className="flex-1 min-w-0">
          <ProgressBar
            current={answeredNonDeferrable}
            total={NON_DEFERRABLE_COUNT}
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <SaveIndicator status={saveStatus} />
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Start the survey over? This will delete your current answers.")) return;
              try {
                await fetch(`/api/submissions/${submissionId}`, { method: "DELETE" });
              } catch {
                // Non-blocking: even if DELETE fails, reload to init a fresh session.
              }
              window.location.reload();
            }}
            className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 hover:text-black transition-colors whitespace-nowrap"
          >
            Start over
          </button>
        </div>
      </div>

      {/* Messages + FinalReview — scrollable area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto px-6 py-6">
          {messages.map((msg) => (
            <Message
              key={msg.id}
              sender={msg.sender}
              text={msg.text}
              extractedKeys={msg.extractedKeys}
              flags={flags}
              onToggleFlag={onToggleFlag}
              submissionId={submissionId}
            />
          ))}
          {isTyping && <TypingIndicator />}
        </div>

        {canComplete && (
          <FinalReview
            submissionId={submissionId}
            programAnswers={programAnswers}
            soulAnswers={soulAnswers}
            flags={flags || {}}
            onToggleFlag={onToggleFlag}
          />
        )}
      </div>

      {/* Chip bar + input — pinned to bottom */}
      <div className="border-t border-gray-200 bg-white">
        {showChips && (
          <div className="px-6 pt-4 max-w-2xl mx-auto">
            <QuickReplies
              options={currentQuestion!.quickReplies!}
              selected={
                currentQuestion!.type === "chips_multi"
                  ? currentSelections()
                  : inputValue
                  ? [inputValue]
                  : []
              }
              multi={currentQuestion!.type === "chips_multi"}
              onSelect={handleChipClick}
            />
          </div>
        )}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex items-end gap-4 px-6 py-4 max-w-2xl mx-auto"
        >
          <div className="flex-1">
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                currentQuestion?.placeholder || "Type your answer..."
              }
              disabled={isTyping}
              autoFocus
            />
          </div>
          <Button type="submit" disabled={!inputValue.trim() || isTyping}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
