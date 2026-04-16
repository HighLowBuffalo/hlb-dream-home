"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PROGRAM_QUESTIONS, Question } from "@/lib/data/questions";
import Message from "./Message";
import QuickReplies from "./QuickReplies";
import TypingIndicator from "./TypingIndicator";
import UploadWidget from "./UploadWidget";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import SaveIndicator from "@/components/ui/SaveIndicator";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface ChatMessage {
  id: string;
  sender: "hlb" | "user";
  text: string;
}

interface ChatInterfaceProps {
  answers?: Record<string, string>;
  onAnswer?: (key: string, value: string) => void;
  onComplete?: () => void;
  saveStatus?: SaveStatus;
  submissionId?: string | null;
}

export default function ChatInterface({
  answers: initialAnswers = {},
  onAnswer,
  onComplete,
  saveStatus = "idle",
  submissionId,
}: ChatInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState("");
  const [stepperValue, setStepperValue] = useState(3);
  const [isTyping, setIsTyping] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const question = PROGRAM_QUESTIONS[currentIndex] as Question | undefined;
  const answeredCount = Object.keys(answers).length;

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  // Show first question
  useEffect(() => {
    if (messages.length === 0 && question) {
      showQuestion(question);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resume from saved answers
  useEffect(() => {
    if (Object.keys(initialAnswers).length > 0) {
      let resumeIndex = 0;
      for (let i = 0; i < PROGRAM_QUESTIONS.length; i++) {
        if (initialAnswers[PROGRAM_QUESTIONS[i].key]) {
          resumeIndex = i + 1;
        } else {
          break;
        }
      }
      if (resumeIndex > 0 && resumeIndex < PROGRAM_QUESTIONS.length) {
        setCurrentIndex(resumeIndex);
        setMessages([
          {
            id: "resume",
            sender: "hlb",
            text: "Welcome back. Let\u2019s pick up where you left off.",
          },
          {
            id: `q-${resumeIndex}`,
            sender: "hlb",
            text: PROGRAM_QUESTIONS[resumeIndex].text,
          },
        ]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showQuestion(q: Question) {
    setIsTyping(true);
    setShowOtherInput(false);
    setOtherValue("");
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: `q-${q.key}`, sender: "hlb", text: q.text },
      ]);
      if (q.type === "stepper") {
        setStepperValue(q.min ?? 1);
      }
      inputRef.current?.focus();
    }, 600);
  }

  const saveAnswer = useCallback(
    (key: string, value: string) => {
      setAnswers((prev) => ({ ...prev, [key]: value }));
      onAnswer?.(key, value);
    },
    [onAnswer]
  );

  function advance(value: string) {
    if (!question) return;

    // Add user message
    if (value.trim()) {
      setMessages((prev) => [
        ...prev,
        { id: `a-${question.key}`, sender: "user", text: value },
      ]);
      saveAnswer(question.key, value);
    }

    // Reset input state
    setInputValue("");
    setSelectedChips([]);
    setShowOtherInput(false);
    setOtherValue("");

    // Advance
    const nextIndex = currentIndex + 1;
    if (nextIndex >= PROGRAM_QUESTIONS.length) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: "done",
            sender: "hlb",
            text: "That covers the practical side. Now let\u2019s talk about the soul of your home \u2014 the feelings and experiences that matter most to you.",
          },
        ]);
        onComplete?.();
      }, 800);
      return;
    }

    setCurrentIndex(nextIndex);
    showQuestion(PROGRAM_QUESTIONS[nextIndex]);
  }

  function submitAnswer(value: string) {
    if (!question || !value.trim()) return;
    advance(value);
  }

  function handleSkip() {
    if (!question) return;
    // Add skip message
    setMessages((prev) => [
      ...prev,
      { id: `a-${question.key}`, sender: "user", text: "Skipped" },
    ]);
    // Don't save, just advance
    setInputValue("");
    setSelectedChips([]);
    setShowOtherInput(false);
    setOtherValue("");

    const nextIndex = currentIndex + 1;
    if (nextIndex >= PROGRAM_QUESTIONS.length) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: "done",
            sender: "hlb",
            text: "That covers the practical side. Now let\u2019s talk about the soul of your home \u2014 the feelings and experiences that matter most to you.",
          },
        ]);
        onComplete?.();
      }, 800);
      return;
    }

    setCurrentIndex(nextIndex);
    showQuestion(PROGRAM_QUESTIONS[nextIndex]);
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitAnswer(inputValue);
  }

  function handleChipSelect(value: string) {
    if (value === "__other__") {
      setShowOtherInput(true);
      return;
    }
    if (question?.type === "chips_single") {
      submitAnswer(value);
    } else {
      setSelectedChips((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value]
      );
    }
  }

  function handleChipsConfirm() {
    const parts = [...selectedChips];
    if (otherValue.trim()) parts.push(otherValue.trim());
    if (parts.length > 0) {
      submitAnswer(parts.join(", "));
    }
  }

  function handleOtherSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (question?.type === "chips_single" && otherValue.trim()) {
      submitAnswer(otherValue.trim());
    }
  }

  function handleStepperSubmit() {
    submitAnswer(String(stepperValue));
  }

  const step = question?.step ?? 1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 gap-4">
        <div className="flex-1 min-w-0">
          <ProgressBar
            current={answeredCount}
            total={PROGRAM_QUESTIONS.length}
            label="The Program"
          />
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        {messages.map((msg) => (
          <Message key={msg.id} sender={msg.sender} text={msg.text} />
        ))}
        {isTyping && <TypingIndicator />}

        {/* Quick replies / chips */}
        {!isTyping && question?.quickReplies && (
          <div className="mb-4">
            <QuickReplies
              options={
                question.quickReplies.some(r => r.toLowerCase() === "other")
                  ? question.quickReplies
                  : [...question.quickReplies, "Other"]
              }
              selected={selectedChips}
              multi={question.type === "chips_multi"}
              onSelect={(v) =>
                handleChipSelect(v.toLowerCase() === "other" ? "__other__" : v)
              }
            />
            {showOtherInput && (
              <form onSubmit={handleOtherSubmit} className="mt-3 flex gap-3">
                <Input
                  value={otherValue}
                  onChange={(e) => setOtherValue(e.target.value)}
                  placeholder="Tell us..."
                  autoFocus
                />
                {question.type === "chips_single" && (
                  <Button type="submit" disabled={!otherValue.trim()}>
                    Send
                  </Button>
                )}
              </form>
            )}
            {question.type === "chips_multi" &&
              (selectedChips.length > 0 || otherValue.trim()) && (
                <div className="mt-3">
                  <Button onClick={handleChipsConfirm}>
                    Continue &rarr;
                  </Button>
                </div>
              )}
          </div>
        )}

        {/* Stepper */}
        {!isTyping && question?.type === "stepper" && (
          <div className="flex items-center gap-6 mb-4">
            <button
              type="button"
              onClick={() =>
                setStepperValue((v) =>
                  Math.max(question.min ?? 0, v - step)
                )
              }
              className="w-10 h-10 border border-gray-200 text-lg font-light hover:border-black transition-colors"
            >
              &minus;
            </button>
            <span className="text-2xl font-light w-12 text-center">
              {stepperValue % 1 === 0 ? stepperValue : stepperValue.toFixed(1)}
            </span>
            <button
              type="button"
              onClick={() =>
                setStepperValue((v) =>
                  Math.min(question.max ?? 99, v + step)
                )
              }
              className="w-10 h-10 border border-gray-200 text-lg font-light hover:border-black transition-colors"
            >
              +
            </button>
            <Button onClick={handleStepperSubmit}>Continue &rarr;</Button>
          </div>
        )}

        {/* Upload widget */}
        {!isTyping && question?.uploadContext && (
          <UploadWidget
            contextKey={question.uploadContext}
            contextLabel="reference images"
            submissionId={submissionId || undefined}
          />
        )}
      </div>

      {/* Text input + skip */}
      {!isTyping &&
        question &&
        (question.type === "text" || question.type === "number") && (
          <div className="border-t border-gray-200">
            <form
              onSubmit={handleTextSubmit}
              className="flex items-end gap-4 px-6 py-4"
            >
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  type={question.type === "number" ? "number" : "text"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={question.placeholder || "Type your answer..."}
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={!inputValue.trim()}>
                Send
              </Button>
            </form>
            <div className="px-6 pb-3">
              <button
                type="button"
                onClick={handleSkip}
                className="text-[10px] font-medium tracking-[0.12em] uppercase text-gray-400 hover:text-black transition-colors"
              >
                Skip this question
              </button>
            </div>
          </div>
        )}

      {/* Skip for stepper/chips questions */}
      {!isTyping &&
        question &&
        question.type !== "text" &&
        question.type !== "number" && (
          <div className="px-6 py-3 border-t border-gray-200">
            <button
              type="button"
              onClick={handleSkip}
              className="text-[10px] font-medium tracking-[0.12em] uppercase text-gray-400 hover:text-black transition-colors"
            >
              Skip this question
            </button>
          </div>
        )}
    </div>
  );
}
