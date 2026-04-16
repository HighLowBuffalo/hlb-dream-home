"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PROGRAM_QUESTIONS } from "@/lib/data/questions";
import Message from "./Message";
import TypingIndicator from "./TypingIndicator";
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

interface ApiMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  answers?: Record<string, string>;
  onAnswer?: (key: string, value: string) => void;
  onComplete?: () => void;
  saveStatus?: SaveStatus;
  submissionId?: string | null;
}

/**
 * Parse <answer key="...">...</answer> tags from Claude's response.
 * Returns the display text (tags stripped) and extracted answers.
 */
function parseResponse(text: string): {
  displayText: string;
  answers: { key: string; value: string }[];
  isComplete: boolean;
} {
  const answers: { key: string; value: string }[] = [];
  const answerRegex = /<answer key="([^"]+)">([^<]*)<\/answer>/g;
  let match;
  while ((match = answerRegex.exec(text)) !== null) {
    answers.push({ key: match[1], value: match[2].trim() });
  }

  const isComplete = text.includes("<survey_complete>true</survey_complete>");

  // Strip tags from display text
  const displayText = text
    .replace(/<answer key="[^"]+">([^<]*)<\/answer>/g, "")
    .replace(/<survey_complete>true<\/survey_complete>/g, "")
    .trim();

  return { displayText, answers, isComplete };
}

export default function ChatInterface({
  answers: initialAnswers = {},
  onAnswer,
  onComplete,
  saveStatus = "idle",
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [apiMessages, setApiMessages] = useState<ApiMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [answeredKeys, setAnsweredKeys] = useState<Set<string>>(
    new Set(Object.keys(initialAnswers))
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initRef = useRef(false);

  const answeredCount = answeredKeys.size;

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  // Send message to Claude API
  const sendToApi = useCallback(
    async (newApiMessages: ApiMessage[]) => {
      setIsTyping(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newApiMessages }),
        });

        if (!res.ok) {
          throw new Error("Chat API failed");
        }

        const data = await res.json();
        const { displayText, answers, isComplete } = parseResponse(data.text);

        // Save extracted answers
        for (const { key, value } of answers) {
          onAnswer?.(key, value);
          setAnsweredKeys((prev) => new Set([...prev, key]));
        }

        // Add assistant message
        const assistantMsg: ChatMessage = {
          id: `hlb-${Date.now()}`,
          sender: "hlb",
          text: displayText,
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Update API message history with the raw response (including tags)
        setApiMessages((prev) => [
          ...prev,
          { role: "assistant" as const, content: data.text },
        ]);

        if (isComplete) {
          setTimeout(() => onComplete?.(), 1500);
        }

        inputRef.current?.focus();
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
    [onAnswer, onComplete]
  );

  // Start conversation
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const resumeAnswers = Object.keys(initialAnswers);
    let startMessage: ApiMessage;

    if (resumeAnswers.length > 0) {
      // Resuming — tell Claude what we already know
      const summary = resumeAnswers
        .map((key) => {
          const q = PROGRAM_QUESTIONS.find((pq) => pq.key === key);
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
        content:
          "Hi, I'm ready to start the home programming questionnaire.",
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

    // Add user message to UI
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: "user", text: userText },
    ]);

    // Add to API messages and send
    const newApiMessages = [
      ...apiMessages,
      { role: "user" as const, content: userText },
    ];
    setApiMessages(newApiMessages);
    sendToApi(newApiMessages);
  }

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

      {/* Messages — scrollable area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto px-6 py-6">
          {messages.map((msg) => (
            <Message key={msg.id} sender={msg.sender} text={msg.text} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      </div>

      {/* Input — pinned to bottom */}
      <div className="border-t border-gray-200 bg-white">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-4 px-6 py-4 max-w-2xl mx-auto"
        >
          <div className="flex-1">
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your answer..."
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
