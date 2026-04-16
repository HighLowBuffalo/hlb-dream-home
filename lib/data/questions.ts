export type QuestionType =
  | "text"
  | "number"
  | "stepper"
  | "chips_single"
  | "chips_multi";

export interface Question {
  key: string;
  text: string;
  type: QuestionType;
  uploadContext?: string;
  quickReplies?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const PROGRAM_QUESTIONS: Question[] = [
  // --- Intro ---
  {
    key: "name",
    text: "Let's start with the basics. What's your name?",
    type: "text",
    placeholder: "Your full name",
  },
  {
    key: "address",
    text: "What's the address or location for this project?",
    type: "text",
    placeholder: "Street address or general area",
  },
  {
    key: "projectName",
    text: "Do you have a name for this project? If not, we can use your last name.",
    type: "text",
    placeholder: "e.g. The Smith Residence",
  },
  {
    key: "projectType",
    text: "What type of project is this?",
    type: "chips_single",
    quickReplies: ["New construction", "Addition", "Renovation", "Other"],
  },

  // --- Bedrooms / Bathrooms ---
  {
    key: "beds",
    text: "How many bedrooms do you need?",
    type: "stepper",
    min: 1,
    max: 10,
  },
  {
    key: "baths",
    text: "How many bathrooms total? Count powder rooms as half baths.",
    type: "stepper",
    min: 0.5,
    max: 10,
    step: 0.5,
  },
  {
    key: "guests",
    text: "How often do you have overnight guests?",
    type: "chips_single",
    quickReplies: ["Rarely", "A few times a year", "Often", "We have a lot of visitors"],
  },

  // --- Primary suite ---
  {
    key: "primaryBed",
    text: "Tell me about your primary bedroom. What matters most to you in that space?",
    type: "text",
    placeholder: "Size, light, views, privacy...",
  },
  {
    key: "primaryBedMore",
    text: "Anything else about the primary bedroom?",
    type: "text",
    placeholder: "Reading nook, fireplace, balcony...",
  },
  {
    key: "primaryBath",
    text: "What about the primary bathroom? What's important?",
    type: "text",
    placeholder: "Soaking tub, double vanity, walk-in shower...",
  },
  {
    key: "primaryBathMore",
    text: "Anything else for the primary bath?",
    type: "text",
    placeholder: "Heated floors, natural light...",
  },
  {
    key: "primaryCloset",
    text: "How would you describe your ideal closet situation?",
    type: "text",
    placeholder: "Walk-in, his and hers, built-ins...",
  },

  // --- Guest bedrooms ---
  {
    key: "guestBeds",
    text: "Any specific needs for the other bedrooms? En-suites, shared baths, flex space?",
    type: "text",
    placeholder: "e.g. Kids' rooms with shared bath, guest suite on main floor...",
  },

  // --- Kitchen ---
  {
    key: "kitchen",
    text: "Let's talk about the kitchen. What's your vision?",
    type: "text",
    placeholder: "Island, open to living, pantry...",
  },
  {
    key: "kitchenUsage",
    text: "How do you actually use your kitchen day to day?",
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
    type: "text",
    placeholder: "Appliance preferences, layout ideas...",
  },
  {
    key: "kitchenAdj",
    text: "What should the kitchen be adjacent to?",
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
    type: "stepper",
    min: 2,
    max: 20,
  },
  {
    key: "diningSeats",
    text: "And when you really go all out for a gathering — how many seats?",
    type: "stepper",
    min: 4,
    max: 30,
  },
  {
    key: "diningNotes",
    text: "What matters to you about the dining experience?",
    type: "text",
    placeholder: "Formal vs casual, connection to kitchen or outdoors...",
  },
  {
    key: "diningMore",
    text: "Anything else about dining?",
    type: "text",
    placeholder: "Breakfast nook, butler's pantry, bar area...",
  },

  // --- Living ---
  {
    key: "living",
    text: "Tell me about your living space. What do you want it to feel like?",
    type: "text",
    placeholder: "Open, cozy, connected to outdoors...",
  },
  {
    key: "livingMore",
    text: "Anything else about the living areas?",
    type: "text",
    placeholder: "Fireplace, built-ins, media wall...",
  },

  // --- Entry / Mudroom ---
  {
    key: "entryMud",
    text: "What's the entry experience you want? Do you need a mudroom?",
    type: "text",
    placeholder: "Grand entry, simple foyer, mudroom with cubbies...",
  },
  {
    key: "entryMore",
    text: "Anything else about entry or mudroom?",
    type: "text",
    placeholder: "Dog wash, boot storage, drop zone...",
  },

  // --- Laundry ---
  {
    key: "laundry",
    text: "Where do you want laundry and how important is it?",
    type: "text",
    placeholder: "Near bedrooms, main floor, large folding area...",
  },

  // --- Office ---
  {
    key: "office",
    text: "Do you need a home office? For one person or two?",
    type: "text",
    placeholder: "Dedicated office, shared space, library/office combo...",
  },
  {
    key: "officeAdj",
    text: "Where should the office be in relation to the rest of the house?",
    type: "text",
    placeholder: "Near entry, tucked away, separate from kids' areas...",
  },

  // --- Special rooms ---
  {
    key: "specialRooms",
    text: "Any special rooms? Select all that apply.",
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
    type: "text",
    placeholder: "Size, equipment, adjacencies...",
  },

  // --- Garage ---
  {
    key: "garageCount",
    text: "How many cars in the garage?",
    type: "stepper",
    min: 0,
    max: 6,
  },

  // --- Outdoor ---
  {
    key: "outdoor",
    text: "What outdoor spaces do you want?",
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
    type: "chips_multi",
    quickReplies: ["Pool", "Hot tub", "Both", "Neither"],
  },
  {
    key: "outdoorKitchen",
    text: "Outdoor kitchen?",
    type: "chips_single",
    quickReplies: ["Yes, full outdoor kitchen", "Just a grill area", "No"],
  },
  {
    key: "outdoorMore",
    text: "Anything else about outdoor living?",
    type: "text",
    placeholder: "Gardens, play area, views to protect...",
  },

  // --- Entertaining ---
  {
    key: "entertaining",
    text: "How important is entertaining at home?",
    type: "chips_single",
    quickReplies: [
      "It's central to how we live",
      "We host sometimes",
      "Rarely — home is mostly private",
    ],
  },

  // --- Final notes ---
  {
    key: "pNotes",
    text: "Any final thoughts about your home's program — spaces we didn't cover, or things you want to emphasize?",
    type: "text",
    placeholder: "Anything else on your mind...",
    uploadContext: "inspiration",
  },
];
