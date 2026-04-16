import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SYSTEM_PROMPT } from "./prompt";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Lightweight sanity-check the LLM emitted something that parses.
// Malformed tags are silently dropped by the client-side extractor today;
// warn on the server so we can spot regressions in logs.
function warnOnMalformedTags(text: string): void {
  // Opens we saw without a close.
  const opens = (text.match(/<answer\b/g) || []).length;
  const closes = (text.match(/<\/answer>/g) || []).length;
  if (opens !== closes) {
    console.warn(
      `[chat] mismatched <answer> tags: ${opens} open, ${closes} close. Raw: ${text.slice(0, 200)}`
    );
  }
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { messages } = body as { messages: ChatMessage[] };

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json(
      { error: "messages array is required" },
      { status: 400 }
    );
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    warnOnMalformedTags(text);

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
