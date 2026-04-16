/**
 * Lightweight eval harness for the HLB survey system prompt.
 *
 * Runs scripted conversations through the live Anthropic API using the
 * same system prompt the production route uses, then asserts on the
 * model's response text. Catches the class of bugs the user surfaced
 * in the "LLM behavior issues" feedback — hallucination, off-scope
 * questions, over-probing — before the code hits Vercel.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... npm run test:evals
 *     (or rely on .env.local auto-load; see below)
 *
 * Cost: ~$0.10 per full run.
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  For each CASE:                                           │
 *   │    1. Build messages array (scripted conversation)        │
 *   │    2. Call Haiku with SYSTEM_PROMPT                       │
 *   │    3. Run assertions on response.text                     │
 *   │    4. Print PASS/FAIL with excerpt + reason               │
 *   │  Exit 0 on all pass, 1 on any fail.                       │
 *   └──────────────────────────────────────────────────────────┘
 */

import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "../app/api/chat/prompt";
import { stripLLMTags } from "../lib/chat/parseLLMResponse";
import { loadEnv } from "../scripts/util/loadEnv.mjs";

loadEnv();

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("Missing ANTHROPIC_API_KEY in .env.local or shell env.");
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey });
const MODEL = "claude-haiku-4-5-20251001";

// --- Types ---
interface Turn {
  role: "user" | "assistant";
  content: string;
}
interface EvalCase {
  name: string;
  /** Scripted prior conversation. Last turn is always from the user. */
  history: Turn[];
  /** Run on the model's response text; return null on pass or a failure reason. */
  assert: (responseText: string) => string | null;
}

// --- Ask Haiku for one response given a scripted history ---
async function ask(history: Turn[]): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: history.map((t) => ({ role: t.role, content: t.content })),
  });
  return response.content[0].type === "text" ? response.content[0].text : "";
}

// --- Assertion helpers ---
const lc = (s: string) => s.toLowerCase();
const containsAny = (text: string, needles: string[]): string | null => {
  const low = lc(text);
  const hit = needles.find((n) => low.includes(n.toLowerCase()));
  return hit || null;
};

// --- Cases ---
const CASES: EvalCase[] = [
  {
    name: "1. Does not hallucinate a last name",
    history: [
      {
        role: "user",
        content: "I'm ready to start the home programming questionnaire.",
      },
      { role: "assistant", content: "Hi there. What's your name?" },
      { role: "user", content: "Tim" },
      {
        role: "assistant",
        content:
          "Great to meet you, Tim. What's the address or location for this project?",
      },
      { role: "user", content: "123 B St" },
      {
        role: "assistant",
        content:
          "Got it, 123 B St. Do you have a name for this project, or should we just use your last name?",
      },
      { role: "user", content: "just use my last name" },
      {
        role: "assistant",
        content:
          "Perfect. So what type of project is this — are we building new from scratch, or is this a renovation?",
      },
      { role: "user", content: "Do you know my last name? what project name did you save?" },
    ],
    assert: (text) => {
      // Should admit it doesn't have the last name, not fabricate one.
      const low = lc(text);
      const admits =
        low.includes("don't have") ||
        low.includes("don't actually have") ||
        low.includes("haven't") ||
        low.includes("not saved") ||
        low.includes("no last name") ||
        low.includes("you haven't told") ||
        low.includes("haven't shared") ||
        low.includes("you haven't given");
      if (!admits) {
        return `Expected admission of ignorance; got: "${text.slice(0, 200)}"`;
      }
      // Should also NOT emit an <answer key="projectName"> tag with a fabricated value.
      const fabricatedProjectName = /<answer key="projectName">(?!.*(unknown|last name)).*<\/answer>/i;
      if (fabricatedProjectName.test(text)) {
        return `Model fabricated a projectName tag: ${text.match(fabricatedProjectName)?.[0]}`;
      }
      return null;
    },
  },

  {
    name: "2. Does not proactively ask about site conditions",
    history: [
      {
        role: "user",
        content: "I'm ready to start the home programming questionnaire.",
      },
      { role: "assistant", content: "Hi. Let's start with the basics. What's your name?" },
      { role: "user", content: "Tim" },
      { role: "assistant", content: "Nice to meet you, Tim. What's the address for this project?" },
      { role: "user", content: "123 B St" },
      {
        role: "assistant",
        content: "Great. What do you love about where you live now, and what are you ready to leave behind?",
      },
      { role: "user", content: "too small to host" },
    ],
    assert: (text) => {
      // Response must NOT ask about views/slope/orientation/trees/neighbors.
      const forbidden = [
        "views",
        "slope",
        "orientation",
        "trees",
        "neighbors",
        "lot",
        "grade",
        "south-facing",
        "west-facing",
        "east-facing",
        "north-facing",
      ];
      const hit = containsAny(text, forbidden);
      if (hit) {
        return `Response contained forbidden site-topic word "${hit}": "${text.slice(0, 200)}"`;
      }
      return null;
    },
  },

  {
    name: "3. Keeps responses brief (does not probe excessively)",
    history: [
      {
        role: "user",
        content: "I'm ready to start the home programming questionnaire.",
      },
      { role: "assistant", content: "Hi, let's start. What's your name?" },
      { role: "user", content: "Tim" },
      {
        role: "assistant",
        content: "Nice to meet you, Tim. Address for the project?",
      },
      { role: "user", content: "123 B St" },
      {
        role: "assistant",
        content: "Got it. Who's going to be living in the home?",
      },
      { role: "user", content: "Two adults, two kids ages 8 and 10" },
    ],
    assert: (text) => {
      const visible = stripLLMTags(text);
      // Rough sentence count: split on . ? ! then filter empties.
      const sentences = visible
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (sentences.length > 3) {
        return `Response too long (${sentences.length} sentences). Visible text: "${visible.slice(0, 300)}"`;
      }
      // Catalog has legitimate compound questions (e.g. "What do you love
      // about where you live now? And what are you most eager to leave
      // behind?") with 2 ?s, so ≤2 is baseline; 3+ means real probing.
      const qMarks = (visible.match(/\?/g) || []).length;
      if (qMarks > 2) {
        return `Response contained ${qMarks} questions (probing). Visible: "${visible.slice(0, 300)}"`;
      }
      return null;
    },
  },

  {
    name: "4. Reflects a tradeoff insight when client expresses one",
    history: [
      {
        role: "user",
        content: "I'm ready to start the home programming questionnaire.",
      },
      { role: "assistant", content: "Hi Tim, tell me about your primary bedroom. What matters most?" },
      {
        role: "user",
        content: "walk-in closet and 5-piece ensuite, but both can be small",
      },
    ],
    assert: (text) => {
      // Must reflect the tradeoff — something about maximizing one thing over another,
      // OR acknowledging that both are efficient/compact.
      const low = lc(text);
      const insightMarkers = [
        "maximizing",
        "prioritize",
        "prioritiz",
        "trade",
        "over the",
        "over private",
        "over bath",
        "over closet",
        "efficient",
        "compact",
        "less space",
        "smaller",
        "more space",
        "keep the",
        "living space",
      ];
      const hit = insightMarkers.find((m) => low.includes(m));
      if (!hit) {
        return `No tradeoff-reflection detected. Response: "${text.slice(0, 300)}"`;
      }
      return null;
    },
  },

  {
    name: "5. Resilient to a 'skip' — does not re-ask the same question",
    history: [
      {
        role: "user",
        content: "I'm ready to start the home programming questionnaire.",
      },
      {
        role: "assistant",
        content: "Hi. Do you have a construction budget range in mind?",
      },
      { role: "user", content: "skip" },
    ],
    assert: (text) => {
      // Strip metadata tags so a skip-tag containing "budgetRange" isn't
      // mistaken for a re-ask. Only the visible text decides.
      const visible = lc(stripLLMTags(text));
      const reasks = ["budget", "how much", "construction cost"];
      const hit = reasks.find((m) => visible.includes(m));
      if (hit) {
        return `Re-asked after 'skip'. Found "${hit}" in visible text: "${visible.slice(0, 200)}"`;
      }
      return null;
    },
  },

  {
    name: "6. Signals completion only when appropriate (not at program start)",
    history: [
      {
        role: "user",
        content: "I'm ready to start the home programming questionnaire.",
      },
      { role: "assistant", content: "Hi. What's your name?" },
      { role: "user", content: "Tim" },
    ],
    assert: (text) => {
      if (/<survey_complete>true<\/survey_complete>/.test(text)) {
        return `Prematurely signaled completion after one answer: "${text.slice(0, 200)}"`;
      }
      return null;
    },
  },

  {
    // Regression guard: the <current_question> turn-marking tag once
    // eclipsed the <answer> extraction tag in the model's attention,
    // causing answers to silently drop (progress bar stuck at 0/N).
    // This case asserts both tags coexist in a well-formed response.
    name: "7. Emits <answer> tag when the client just gave a saveable fact",
    history: [
      {
        role: "user",
        content: "I'm ready to start the home programming questionnaire.",
      },
      {
        role: "assistant",
        content:
          "<current_question key=\"name\"/>Hi. What's your name?",
      },
      { role: "user", content: "Tim" },
    ],
    assert: (text) => {
      const hasAnswerTag = /<answer key="name">[^<]+<\/answer>/i.test(text);
      const hasCurrentQuestion = /<current_question key="[^"]+"\s*\/?>/i.test(
        text
      );
      if (!hasAnswerTag) {
        return `Missing <answer key="name"> tag; name would be lost. Response: "${text.slice(0, 250)}"`;
      }
      if (!hasCurrentQuestion) {
        return `Missing <current_question> tag; chip UI would break. Response: "${text.slice(0, 250)}"`;
      }
      return null;
    },
  },
];

// --- Runner ---
async function run() {
  let passed = 0;
  let failed = 0;
  const failures: { name: string; reason: string }[] = [];

  console.log(`\nRunning ${CASES.length} prompt eval cases against ${MODEL}...\n`);

  for (const tc of CASES) {
    process.stdout.write(`• ${tc.name} ... `);
    try {
      const text = await ask(tc.history);
      const reason = tc.assert(text);
      if (reason === null) {
        console.log("PASS");
        passed++;
      } else {
        console.log("FAIL");
        console.log(`    ${reason}\n`);
        failed++;
        failures.push({ name: tc.name, reason });
      }
    } catch (err) {
      console.log("ERROR");
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`    ${msg}\n`);
      failed++;
      failures.push({ name: tc.name, reason: `Error: ${msg}` });
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const f of failures) {
      console.log(`  - ${f.name}: ${f.reason}`);
    }
    process.exit(1);
  }
  process.exit(0);
}

run();
