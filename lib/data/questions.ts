// Unified question catalog — Program (prescriptive) + Soul (reflective).
//
// The chat walks this list in order. Program questions come first, then
// Soul questions. "Deferrable" questions are probes/follow-ups the LLM
// only asks at the end if earlier answers left gaps. "Uploadable" means
// the chat UI renders an "Add image" button under the question so the
// client can attach inspiration photos keyed to that question_key.
//
// NOTE on the removed "site" question: per user feedback, the architect
// already has site info (views, slope, orientation, trees, neighbors)
// from other sources. The LLM is also instructed in the system prompt
// not to ask site questions unprompted. Historical answers with
// question_key="site" remain valid in the DB for older submissions.

export type QuestionType =
  | "text"
  | "number"
  | "stepper"
  | "chips_single"
  | "chips_multi";

export type Phase = "program" | "soul";
export type AnswerTable = "program" | "soul";

export interface Question {
  key: string;
  /** The question the LLM will ask, verbatim or paraphrased. */
  text: string;
  /** Short label for display in admin/report views. Defaults to a truncation of `text` if absent. */
  label?: string;
  phase: Phase;
  /** Which DB table answers for this question go into. */
  table: AnswerTable;
  /** If true, LLM asks only at the end when earlier answers left a gap. */
  deferrable: boolean;
  /** If true, chat UI shows "Add image" under this question's bubble. */
  uploadable: boolean;
  /** Optional UI hint for structured input widgets (chips, stepper). */
  type?: QuestionType;
  quickReplies?: string[];
  placeholder?: string;
}

export const QUESTIONS: Question[] = [
  // =====================================================================
  // PROGRAM — prescriptive, quick answers
  // =====================================================================

  // --- Intro ---
  {
    key: "name",
    text: "Let's start with the basics. What's your name?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "text",
    placeholder: "Your full name",
  },
  {
    key: "address",
    text: "What's the address or location for this project?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "text",
    placeholder: "Street address or general area",
  },
  {
    key: "projectName",
    text: "Do you have a name for this project? If not, we can use your last name.",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "text",
    placeholder: "e.g. The Smith Residence",
  },
  {
    key: "projectType",
    text: "What type of project is this?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "chips_single",
    quickReplies: ["New construction", "Addition", "Renovation", "Other"],
  },

  // --- Household & Context ---
  {
    key: "household",
    text: "Who will be living in this home? Tell me about your household — adults, kids (ages), pets.",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "text",
    placeholder: "e.g. Two adults, two kids (8 and 12), one dog",
  },
  {
    key: "currentHome",
    text: "What do you love about where you live now? And what are you most eager to leave behind?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "text",
  },
  {
    key: "budgetRange",
    text: "Do you have a construction budget range in mind? Even a rough range helps the design team.",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "chips_single",
    quickReplies: [
      "Under $1M",
      "$1M - $2M",
      "$2M - $3M",
      "$3M - $5M",
      "$5M+",
      "Not sure yet",
    ],
  },
  {
    key: "timeline",
    text: "When are you hoping to move in? Any hard deadlines?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "text",
    placeholder: "e.g. Within 2 years, before kids start school",
  },

  // --- Bedrooms / Bathrooms ---
  {
    key: "beds",
    text: "How many bedrooms do you need?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "stepper",
  },
  {
    key: "baths",
    text: "How many bathrooms total? Count powder rooms as half baths.",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "stepper",
  },
  {
    key: "guests",
    text: "How often do you have overnight guests?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "chips_single",
    quickReplies: ["Rarely", "A few times a year", "Often", "We have a lot of visitors"],
  },

  // --- Primary suite ---
  {
    key: "primaryBed",
    text: "Tell me about your primary bedroom. What matters most to you in that space?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "text",
    placeholder: "Size, light, privacy",
  },
  {
    key: "primaryBedMore",
    text: "Anything else about the primary bedroom?",
    phase: "program",
    table: "program",
    deferrable: true,
    uploadable: false,
    type: "text",
  },
  {
    key: "primaryBath",
    text: "What about the primary bathroom? What's important?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "text",
    placeholder: "Soaking tub, double vanity, walk-in shower",
  },
  {
    key: "primaryBathMore",
    text: "Anything else for the primary bath?",
    phase: "program",
    table: "program",
    deferrable: true,
    uploadable: false,
    type: "text",
  },
  {
    key: "primaryCloset",
    text: "How would you describe your ideal closet situation?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "text",
    placeholder: "Walk-in, his and hers, built-ins",
  },

  // --- Guest bedrooms ---
  {
    key: "guestBeds",
    text: "Any specific needs for the other bedrooms? En-suites, shared baths, flex space?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "text",
    placeholder: "e.g. Kids' rooms with shared bath, guest suite on main floor",
  },

  // --- Kitchen ---
  {
    key: "kitchen",
    text: "Let's talk about the kitchen. What's your vision?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "text",
    placeholder: "Island, open to living, pantry",
  },
  {
    key: "kitchenUsage",
    text: "How do you actually use your kitchen day to day?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "chips_single",
    quickReplies: [
      "We cook most meals at home",
      "We cook sometimes",
      "Mostly takeout and simple meals",
      "We entertain and cook a lot",
    ],
  },
  {
    key: "kitchenFeatures",
    text: "Any must-have kitchen features?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "chips_multi",
    quickReplies: [
      "Double oven",
      "Gas range",
      "Large island",
      "Walk-in pantry",
      "Butler's pantry",
      "Pot filler",
      "Wine fridge",
      "Bar seating",
    ],
  },
  {
    key: "kitchenMore",
    text: "Anything else about the kitchen?",
    phase: "program",
    table: "program",
    deferrable: true,
    uploadable: false,
    type: "text",
  },
  {
    key: "kitchenAdj",
    text: "What should the kitchen be adjacent to?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "chips_multi",
    quickReplies: [
      "Dining room",
      "Living room",
      "Outdoor patio",
      "Mudroom",
      "Garage",
    ],
  },

  // --- Dining ---
  {
    key: "dining",
    text: "How many people do you want to seat for dinner on a regular basis?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "stepper",
  },
  {
    key: "diningSeats",
    text: "And when you really go all out for a gathering — how many seats?",
    phase: "program",
    table: "program",
    deferrable: true,
    uploadable: false,
    type: "stepper",
  },
  {
    key: "diningNotes",
    text: "What matters to you about the dining experience?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "text",
    placeholder: "Formal vs casual, connection to kitchen or outdoors",
  },
  {
    key: "diningMore",
    text: "Anything else about dining?",
    phase: "program",
    table: "program",
    deferrable: true,
    uploadable: false,
    type: "text",
  },

  // --- Living ---
  {
    key: "living",
    text: "Tell me about your living space. What do you want it to feel like?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "text",
    placeholder: "Open, cozy, connected to outdoors",
  },
  {
    key: "livingMore",
    text: "Anything else about the living areas?",
    phase: "program",
    table: "program",
    deferrable: true,
    uploadable: false,
    type: "text",
  },

  // --- Entry / Mudroom ---
  {
    key: "entryMud",
    text: "What's the entry experience you want? Do you need a mudroom?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "text",
    placeholder: "Grand entry, simple foyer, mudroom with cubbies",
  },
  {
    key: "entryMore",
    text: "Anything else about entry or mudroom?",
    phase: "program",
    table: "program",
    deferrable: true,
    uploadable: false,
    type: "text",
  },

  // --- Laundry ---
  {
    key: "laundry",
    text: "Where do you want laundry and how important is it?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "text",
    placeholder: "Near bedrooms, main floor, large folding area",
  },

  // --- Office ---
  {
    key: "office",
    text: "Do you need a home office? For one person or two? Attached to the house or detached?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "text",
    placeholder: "Dedicated office, shared space, detached building",
  },
  {
    key: "officeAdj",
    text: "Where should the office be in relation to the rest of the house?",
    phase: "program",
    table: "program",
    deferrable: true,
    uploadable: false,
    type: "text",
  },

  // --- Special rooms ---
  {
    key: "specialRooms",
    text: "Any special rooms? Select all that apply.",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "chips_multi",
    quickReplies: [
      "Gym / workout room",
      "Media / theater room",
      "Library / reading room",
      "Wine cellar",
      "Playroom",
      "In-law suite",
      "Art studio",
      "Music room",
    ],
  },
  {
    key: "specialMore",
    text: "Tell me more about any of those special spaces.",
    phase: "program",
    table: "program",
    deferrable: true,
    uploadable: true,
    type: "text",
  },

  // --- Garage ---
  {
    key: "garageCount",
    text: "How many cars in the garage?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "stepper",
  },

  // --- Outdoor ---
  {
    key: "outdoor",
    text: "What outdoor spaces do you want?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "chips_multi",
    quickReplies: [
      "Covered patio",
      "Open deck",
      "Screened porch",
      "Fire pit area",
      "Sport court",
    ],
  },
  {
    key: "outdoorPool",
    text: "Pool or hot tub?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "chips_multi",
    quickReplies: ["Pool", "Hot tub", "Both", "Neither"],
  },
  {
    key: "outdoorKitchen",
    text: "Outdoor kitchen?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "chips_single",
    quickReplies: ["Yes, full outdoor kitchen", "Just a grill area", "No"],
  },
  {
    key: "outdoorMore",
    text: "Anything else about outdoor living?",
    phase: "program",
    table: "program",
    deferrable: true,
    uploadable: true,
    type: "text",
  },

  // --- Entertaining ---
  {
    key: "entertaining",
    text: "How important is entertaining at home?",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "chips_single",
    quickReplies: [
      "It's central to how we live",
      "We host sometimes",
      "Rarely — home is mostly private",
    ],
  },

  // --- Sustainability ---
  {
    key: "sustainability",
    text: "How important is sustainability to you? Select any that apply.",
    phase: "program",
    table: "program",
    deferrable: false,
    uploadable: false,
    type: "chips_multi",
    quickReplies: [
      "Energy efficiency",
      "Solar panels",
      "Water conservation",
      "Smart home tech",
      "Durable / low-maintenance materials",
      "Not a priority",
    ],
  },

  // --- Final program notes ---
  {
    key: "pNotes",
    text: "Any final thoughts about your home's program — spaces we didn't cover, or things you want to emphasize?",
    phase: "program",
    table: "program",
    deferrable: true,
    uploadable: true,
    type: "text",
  },

  // =====================================================================
  // SOUL — reflective, longer answers invited
  // =====================================================================
  {
    key: "saturdayMorning",
    label: "A perfect Saturday morning at home",
    text: "Walk me through a perfect Saturday morning in your new home. Where do you wake up, what do you see, where does coffee happen, and what does the light look like?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: true,
  },
  {
    key: "placesVisited",
    label: "Places that left an emotional impression",
    text: "Are there any places you've visited — homes, restaurants, hotels, even public spaces — that made you feel something you'd want to feel in your own home?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: true,
  },
  {
    key: "neverWantedToLeave",
    label: "A space you never wanted to leave",
    text: "Think about a space you've been in — anywhere, any time in your life — where you never wanted to leave. What was it about that space?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: true,
  },
  {
    key: "childhood",
    label: "A place from childhood or travels",
    text: "Is there a place from your childhood or travels that still lives in your memory? What do you remember about how it felt?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: true,
  },
  {
    key: "material",
    label: "Materials that feel like home — and ones that don't",
    text: "Is there a material — wood, stone, plaster, brick, concrete, metal — that immediately feels like home to you? And one that doesn't?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: true,
  },
  {
    key: "rituals",
    label: "Times of day and daily rituals",
    text: "Are there particular times of day that matter most to you at home? Morning light, evening wind-down, late-night quiet?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: false,
  },
  {
    key: "family",
    label: "How the household ends up together",
    text: "Where does your household actually end up at the end of the day? And is that where you want them to be?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: false,
  },
  {
    key: "doors",
    label: "Closing a door vs. feeling cut off",
    text: "Are you someone who needs to close a door to feel okay, or does that make you feel cut off? How do you think about privacy vs. connection in a home?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: false,
  },
  {
    key: "chaos",
    label: "Where the chaos lives — hide it or embrace it",
    text: "Describe the messiest, most lived-in version of your home. Where does the chaos live, and do you want to hide it or is it part of the charm?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: false,
  },
  {
    key: "evening",
    label: "An ideal evening at home",
    text: "Imagine your ideal evening at home. What are you doing, who's with you, and what does the space around you feel like?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: false,
  },
  {
    key: "mostYourself",
    label: "A moment of feeling most like yourself in a space",
    text: "When have you felt most like yourself in a space? What was it about that environment that let you be fully you?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: true,
  },
  {
    key: "workaround",
    label: "Something most homes don't accommodate",
    text: "Is there something about the way you actually live that most homes just don't accommodate? A habit, a hobby, a quirk?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: false,
  },
  {
    key: "frontDoor",
    label: "What they want to feel walking through the front door",
    text: "What do you want to feel the moment you walk through your front door at the end of a long day?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: false,
  },
  {
    key: "soulGuests",
    label: "How guests should feel",
    text: "How should your home make guests feel when they arrive? Impressed? Comfortable? Like they can kick their shoes off?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: false,
  },
  {
    key: "sanctuary",
    label: "A personal escape or sanctuary",
    text: "Is there a particular place in the house you want to feel like your personal escape or sanctuary? What would make it that?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: true,
  },
  {
    key: "personality",
    label: "The personality of the home",
    text: "If your home were a person, how would you describe their personality? Quiet and thoughtful? Bold and confident? Warm and easygoing?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: false,
  },
  {
    key: "gathering",
    label: "The best gathering you've experienced",
    text: "Think about the best dinner, gathering, or party you've ever been to. What made the space work for that moment?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: true,
  },
  {
    key: "indulgence",
    label: "The one indulgent feature",
    text: "If budget and convention were completely off the table, what's the one indulgent, maybe even impractical, thing you'd want in your home?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: false,
  },
  {
    key: "future",
    label: "What chapter of life this house is for",
    text: "What chapter of life is this house for? Who will you be in 10 or 15 years, and how should this house grow with you?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: false,
  },
  {
    key: "statement",
    label: "What the home says about you",
    text: "If there's one thing you want your home to say about you — not to show off, but to honestly reflect — what is it?",
    phase: "soul",
    table: "soul",
    deferrable: false,
    uploadable: false,
  },
];

// Convenience accessors (preserve naming used elsewhere in the codebase).
export const PROGRAM_QUESTIONS: Question[] = QUESTIONS.filter((q) => q.phase === "program");
export const SOUL_QUESTIONS: Question[] = QUESTIONS.filter((q) => q.phase === "soul");

/** Lookup a question by key. Returns undefined if not found (e.g. legacy keys). */
export function getQuestion(key: string): Question | undefined {
  return QUESTIONS.find((q) => q.key === key);
}
