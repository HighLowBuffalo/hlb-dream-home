// Shared parser for the three tag types the survey prompt emits:
//   <current_question key="X"/>        — drives the chip UI
//   <answer key="X">Y</answer>         — extractable facts to save
//   <survey_complete>true</survey_complete> — ready-to-submit signal
//
// Used by ChatInterface at runtime and by the eval harness when
// computing visible-text assertions. Having one source of truth keeps
// the runtime strip and the eval strip from drifting.

export interface ParsedLLMResponse {
  /** Text shown to the user, with all tags stripped. */
  displayText: string;
  /** Extracted <answer key="X">Y</answer> pairs. */
  answers: { key: string; value: string }[];
  /** Value of <current_question key="X"/>, or null when X is absent/"none". */
  currentQuestionKey: string | null;
  /** True when the response emitted <survey_complete>true</survey_complete>. */
  isComplete: boolean;
}

const CURRENT_QUESTION_RE = /<current_question key="([^"]+)"\s*\/?>/;
const ANSWER_RE = /<answer key="([^"]+)">([^<]*)<\/answer>/g;
const SURVEY_COMPLETE_RE = /<survey_complete>true<\/survey_complete>/;

// Strip variants — tolerant to whitespace + alt attribute shapes that show
// up in the eval harness (`[^>]*`, multi-line content).
const STRIP_CURRENT_QUESTION_RE = /<current_question key="[^"]+"\s*\/?>/g;
const STRIP_ANSWER_RE = /<answer[^>]*>[\s\S]*?<\/answer>/g;
const STRIP_SURVEY_COMPLETE_RE = /<survey_complete>[\s\S]*?<\/survey_complete>/g;

export function parseLLMResponse(text: string): ParsedLLMResponse {
  const answers: { key: string; value: string }[] = [];
  let m: RegExpExecArray | null;
  // Reset lastIndex — regex with /g is stateful.
  ANSWER_RE.lastIndex = 0;
  while ((m = ANSWER_RE.exec(text)) !== null) {
    answers.push({ key: m[1], value: m[2].trim() });
  }

  const cq = text.match(CURRENT_QUESTION_RE);
  const currentQuestionKey = cq && cq[1] !== "none" ? cq[1] : null;

  const isComplete = SURVEY_COMPLETE_RE.test(text);

  const displayText = text
    .replace(STRIP_CURRENT_QUESTION_RE, "")
    .replace(STRIP_ANSWER_RE, "")
    .replace(STRIP_SURVEY_COMPLETE_RE, "")
    .trim();

  return { displayText, answers, currentQuestionKey, isComplete };
}

/** Strip-only helper for eval harness assertions on visible output. */
export function stripLLMTags(text: string): string {
  return text
    .replace(STRIP_CURRENT_QUESTION_RE, "")
    .replace(STRIP_ANSWER_RE, "")
    .replace(STRIP_SURVEY_COMPLETE_RE, "")
    .trim();
}
