"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PROGRAM_QUESTIONS, Question } from "@/lib/data/questions";
import Message from "./Message";
import QuickReplies from "./QuickReplies";
import TypingIndicator from "./TypingIndicator";
import UploadWidget from "./UploadWidget";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ProgressDots from "@/components/ui/ProgressDots";
import SaveIndicator from "@/components/ui/SaveIndicator";

type SaveStatus = "idle" | "saving" | "saved";

interface ChatMessage {
  id: string;
  sender: "hlb" | "user";
  text: string;
}

interface ChatInterfaceProps {
  answers?: Record<string, string>;
  onAnswer?: (key: string, value: string) => void;
  onComplete?: () => void;
}

export default function ChatInterface({
  answers: initialAnswers = {},
  onAnswer,
  onComplete,
}: ChatInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [stepperValue, setStepperValue] = useState(3);
  const [isTyping, setIsTyping] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const question = PROGRAM_QUESTIONS[currentIndex] as Question | undefined;
  const totalSections = 5;
  const currentSection = Math.min(
    Math.floor((currentIndex / PROGRAM_QUESTIONS.length) * totalSections),
    totalSections - 1
  );

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
            text: "Welcome back. Let's pick up where you left off.",
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
      setSaveStatus("saving");
      onAnswer?.(key, value);
      // TODO: Wire up actual autosave to Supabase
      setTimeout(() => {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }, 500);
    },
    [onAnswer]
  );

  function submitAnswer(value: string) {
    if (!question || !value.trim()) return;

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: `a-${question.key}`, sender: "user", text: value },
    ]);

    // Save
    saveAnswer(question.key, value);

    // Reset input state
    setInputValue("");
    setSelectedChips([]);

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
            text: "That covers the program. Now let's talk about the soul of your home — the feelings and experiences that matter most to you.",
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
    if (selectedChips.length > 0) {
      submitAnswer(selectedChips.join(", "));
    }
  }

  function handleStepperSubmit() {
    submitAnswer(String(stepperValue));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400">
            The Program
          </p>
          <ProgressDots total={totalSections} current={currentSection} />
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
              options={question.quickReplies}
              selected={selectedChips}
              multi={question.type === "chips_multi"}
              onSelect={handleChipSelect}
            />
            {question.type === "chips_multi" && selectedChips.length > 0 && (
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
                setStepperValue((v) => Math.max(question.min ?? 0, v - 1))
              }
              className="w-10 h-10 border border-gray-200 text-lg font-light hover:border-black transition-colors"
            >
              &minus;
            </button>
            <span className="text-2xl font-light w-8 text-center">
              {stepperValue}
            </span>
            <button
              type="button"
              onClick={() =>
                setStepperValue((v) => Math.min(question.max ?? 99, v + 1))
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
          />
        )}
      </div>

      {/* Text input */}
      {!isTyping &&
        question &&
        (question.type === "text" || question.type === "number") && (
          <form
            onSubmit={handleTextSubmit}
            className="flex items-end gap-4 px-6 py-4 border-t border-gray-200"
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
        )}
    </div>
  );
}
