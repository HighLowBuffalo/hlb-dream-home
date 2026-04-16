"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PROGRAM_QUESTIONS } from "@/lib/data/questions";
import { SOUL_QUESTIONS } from "@/lib/data/soulQuestions";
import { SPACE_DEFAULTS } from "@/lib/data/spaceDefaults";
import Button from "@/components/ui/Button";
import QuestionFlags, { type FlagType } from "@/components/ui/QuestionFlags";

interface Answer {
  question_key: string;
  answer_text: string | null;
  answer_data?: Record<string, unknown> | null;
}

interface Flag {
  question_key: string;
  flag_type: FlagType;
}

interface Submission {
  id: string;
  client_name: string | null;
  project_name: string | null;
  address: string | null;
  project_type: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  programAnswers: Answer[];
  soulAnswers: Answer[];
  flags?: Flag[];
}

// Map program answer keys to space defaults for the space program table
const SPACE_KEY_MAP: Record<string, { label: string; defaultKey: string }[]> = {
  beds: [],
  primaryBed: [{ label: "Primary Bedroom", defaultKey: "primaryBed" }],
  primaryBath: [{ label: "Primary Bathroom", defaultKey: "primaryBath" }],
  primaryCloset: [{ label: "Primary Closet", defaultKey: "primaryCloset" }],
  kitchen: [{ label: "Kitchen", defaultKey: "kitchen" }],
  entryMud: [
    { label: "Foyer / Entry", defaultKey: "foyer" },
    { label: "Mudroom", defaultKey: "mudroom" },
  ],
  laundry: [{ label: "Laundry", defaultKey: "laundry" }],
  office: [{ label: "Home Office", defaultKey: "office" }],
};

// Group program questions into labeled sections for display
const PROGRAM_SECTIONS = [
  { title: "Project Basics", keys: ["name", "address", "projectName", "projectType"] },
  { title: "Bedrooms & Bathrooms", keys: ["beds", "baths", "guests", "primaryBed", "primaryBedMore", "primaryBath", "primaryBathMore", "primaryCloset", "guestBeds"] },
  { title: "Kitchen", keys: ["kitchen", "kitchenUsage", "kitchenFeatures", "kitchenMore", "kitchenAdj"] },
  { title: "Dining", keys: ["dining", "diningSeats", "diningNotes", "diningMore"] },
  { title: "Living Spaces", keys: ["living", "livingMore"] },
  { title: "Entry & Mudroom", keys: ["entryMud", "entryMore"] },
  { title: "Laundry", keys: ["laundry"] },
  { title: "Office", keys: ["office", "officeAdj"] },
  { title: "Special Rooms", keys: ["specialRooms", "specialMore"] },
  { title: "Garage", keys: ["garageCount"] },
  { title: "Outdoor Living", keys: ["outdoor", "outdoorPool", "outdoorKitchen", "outdoorMore"] },
  { title: "Entertaining", keys: ["entertaining"] },
  { title: "Final Notes", keys: ["pNotes"] },
];

function buildSpaceTable(answers: Record<string, string>) {
  const spaces: { name: string; dims: string; sqft: number }[] = [];

  // Always include core spaces
  const coreSpaces = [
    { key: "foyer", label: "Foyer / Entry" },
    { key: "living", label: "Living Room" },
    { key: "kitchen", label: "Kitchen" },
    { key: "primaryBed", label: "Primary Bedroom" },
    { key: "primaryBath", label: "Primary Bathroom" },
    { key: "primaryCloset", label: "Primary Closet" },
    { key: "laundry", label: "Laundry" },
  ];

  for (const s of coreSpaces) {
    const def = SPACE_DEFAULTS[s.key];
    if (def) spaces.push({ name: s.label, dims: def.dims, sqft: def.sqft });
  }

  // Bedrooms based on count
  const bedCount = parseInt(answers.beds || "3", 10);
  const guestBedCount = Math.max(0, bedCount - 1);
  for (let i = 0; i < guestBedCount; i++) {
    const def = SPACE_DEFAULTS.bedroom;
    spaces.push({ name: `Bedroom ${i + 2}`, dims: def.dims, sqft: def.sqft });
  }

  // Bathrooms based on count
  const bathCount = parseInt(answers.baths || "2", 10);
  const otherBaths = Math.max(0, bathCount - 1); // minus primary
  for (let i = 0; i < otherBaths; i++) {
    const def = SPACE_DEFAULTS.sharedBath;
    spaces.push({ name: i === otherBaths - 1 ? "Powder Bath" : `Bathroom ${i + 2}`, dims: i === otherBaths - 1 ? SPACE_DEFAULTS.powderBath.dims : def.dims, sqft: i === otherBaths - 1 ? SPACE_DEFAULTS.powderBath.sqft : def.sqft });
  }

  // Dining
  const diningSeats = parseInt(answers.diningSeats || answers.dining || "6", 10);
  const diningKey = diningSeats > 10 ? "diningLarge" : "diningSmall";
  const diningDef = SPACE_DEFAULTS[diningKey];
  spaces.push({ name: "Dining Room", dims: diningDef.dims, sqft: diningDef.sqft });

  // Office
  if (answers.office && answers.office.toLowerCase() !== "no") {
    const def = SPACE_DEFAULTS.office;
    spaces.push({ name: "Home Office", dims: def.dims, sqft: def.sqft });
  }

  // Mudroom
  if (answers.entryMud && answers.entryMud.toLowerCase().includes("mud")) {
    const def = SPACE_DEFAULTS.mudroom;
    spaces.push({ name: "Mudroom", dims: def.dims, sqft: def.sqft });
  }

  // Special rooms
  const specialMap: Record<string, { label: string; key: string }> = {
    "gym": { label: "Gym / Workout Room", key: "gym" },
    "workout": { label: "Gym / Workout Room", key: "gym" },
    "media": { label: "Media Room", key: "mediaRoom" },
    "theater": { label: "Media Room", key: "mediaRoom" },
    "library": { label: "Library / Reading Room", key: "library" },
    "reading": { label: "Library / Reading Room", key: "library" },
    "wine": { label: "Wine Cellar", key: "wineCellar" },
    "playroom": { label: "Playroom", key: "playroom" },
    "in-law": { label: "In-Law Suite", key: "inLawSuite" },
  };

  if (answers.specialRooms) {
    const selected = answers.specialRooms.toLowerCase();
    const added = new Set<string>();
    for (const [keyword, info] of Object.entries(specialMap)) {
      if (selected.includes(keyword) && !added.has(info.key)) {
        added.add(info.key);
        const def = SPACE_DEFAULTS[info.key];
        if (def) spaces.push({ name: info.label, dims: def.dims, sqft: def.sqft });
      }
    }
  }

  // Garage
  const garageCount = parseInt(answers.garageCount || "2", 10);
  if (garageCount > 0) {
    const garageKey = garageCount >= 3 ? "garage3" : garageCount === 2 ? "garage2" : "garage1";
    const def = SPACE_DEFAULTS[garageKey];
    spaces.push({ name: `${garageCount}-Car Garage`, dims: def.dims, sqft: def.sqft });
  }

  // Outdoor
  if (answers.outdoor) {
    const outdoor = answers.outdoor.toLowerCase();
    if (outdoor.includes("covered") || outdoor.includes("patio") || outdoor.includes("porch")) {
      const def = SPACE_DEFAULTS.coveredPatio;
      spaces.push({ name: "Covered Patio / Porch", dims: def.dims, sqft: def.sqft });
    }
  }
  if (answers.outdoorKitchen && answers.outdoorKitchen.toLowerCase().includes("yes")) {
    const def = SPACE_DEFAULTS.outdoorKitchen;
    spaces.push({ name: "Outdoor Kitchen", dims: def.dims, sqft: def.sqft });
  }
  if (answers.outdoorPool) {
    const pool = answers.outdoorPool.toLowerCase();
    if (pool.includes("pool") || pool.includes("both")) {
      spaces.push({ name: "Pool", dims: SPACE_DEFAULTS.pool.dims, sqft: SPACE_DEFAULTS.pool.sqft });
    }
    if (pool.includes("hot tub") || pool.includes("both")) {
      spaces.push({ name: "Hot Tub", dims: SPACE_DEFAULTS.hotTub.dims, sqft: SPACE_DEFAULTS.hotTub.sqft });
    }
  }

  return spaces;
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/submissions/${params.id}`);
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) {
          setError("Could not load your submission.");
          return;
        }
        const data = await res.json();
        setSubmission(data);
      } catch {
        setError("Something went wrong loading your results.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm font-light text-gray-400">Loading your results...</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="text-center">
          <p className="text-sm font-light text-gray-600">{error}</p>
          <button
            onClick={() => router.push("/welcome")}
            className="mt-4 text-sm font-light text-black underline"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  // Build lookup maps
  const programMap: Record<string, string> = {};
  for (const a of submission.programAnswers) {
    if (a.answer_text) programMap[a.question_key] = a.answer_text;
  }

  const soulMap: Record<string, string> = {};
  for (const a of submission.soulAnswers) {
    if (a.answer_text) soulMap[a.question_key] = a.answer_text;
  }

  const flagMap: Record<string, Set<FlagType>> = {};
  for (const f of submission.flags || []) {
    if (!flagMap[f.question_key]) flagMap[f.question_key] = new Set();
    flagMap[f.question_key].add(f.flag_type);
  }

  const questionTextMap: Record<string, string> = {};
  for (const q of PROGRAM_QUESTIONS) {
    questionTextMap[q.key] = q.text;
  }

  const spaces = buildSpaceTable(programMap);
  const totalSqft = spaces.reduce((sum, s) => sum + s.sqft, 0);

  const completedDate = submission.completed_at
    ? new Date(submission.completed_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400">
          Programming Analysis
        </p>
        <Button variant="outline" onClick={() => window.print()}>
          Print / Save PDF
        </Button>
      </div>

      {/* Report content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full">
        {/* Title block */}
        <div className="mb-12">
          <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-4">
            High, Low, Buffalo
          </p>
          <h1 className="text-3xl font-light leading-tight mb-2">
            {submission.project_name || "Home Vision"}
          </h1>
          <div className="text-sm font-light text-gray-600 space-y-1">
            {submission.client_name && <p>{submission.client_name}</p>}
            {submission.address && <p>{submission.address}</p>}
            {submission.project_type && <p>{submission.project_type}</p>}
            {completedDate && <p>Completed {completedDate}</p>}
          </div>
        </div>

        {/* Space Program Table */}
        <div className="mb-12">
          <h2 className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-4">
            Space Program
          </h2>
          <table className="w-full text-sm font-light">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left py-2 text-[10px] font-medium tracking-[0.18em] uppercase">
                  Space
                </th>
                <th className="text-left py-2 text-[10px] font-medium tracking-[0.18em] uppercase">
                  Dimensions
                </th>
                <th className="text-right py-2 text-[10px] font-medium tracking-[0.18em] uppercase">
                  Sq Ft
                </th>
              </tr>
            </thead>
            <tbody>
              {spaces.map((space, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-2">{space.name}</td>
                  <td className="py-2 text-gray-600">{space.dims}</td>
                  <td className="py-2 text-right">{space.sqft.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="border-t border-black">
                <td className="py-2 font-medium">Total</td>
                <td className="py-2"></td>
                <td className="py-2 text-right font-medium">
                  {totalSqft.toLocaleString()} sf
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Program Answers by Section */}
        <div className="mb-12">
          <h2 className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-6">
            The Program
          </h2>

          {PROGRAM_SECTIONS.map((section) => {
            const sectionAnswers = section.keys
              .filter((key) => programMap[key])
              .map((key) => ({
                key,
                question: questionTextMap[key] || key,
                answer: programMap[key],
              }));

            if (sectionAnswers.length === 0) return null;

            return (
              <div key={section.title} className="mb-8">
                <h3 className="text-xs font-medium tracking-wide uppercase text-gray-600 mb-3 pb-1 border-b border-gray-200">
                  {section.title}
                </h3>
                <div className="space-y-3">
                  {sectionAnswers.map(({ key, question, answer }) => (
                    <div key={key}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs text-gray-400 mb-0.5 flex-1">{question}</p>
                        {flagMap[key] && flagMap[key].size > 0 && (
                          <QuestionFlags activeFlags={flagMap[key]} readOnly />
                        )}
                      </div>
                      <p className="text-sm font-light leading-relaxed">{answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Soul Answers */}
        {Object.keys(soulMap).length > 0 && (
          <div className="mb-12">
            <h2 className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-6">
              The Soul of Your Home
            </h2>
            <div className="space-y-6">
              {SOUL_QUESTIONS.filter((q) => soulMap[q.key]).map((q) => (
                <div key={q.key}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-gray-400 mb-1 flex-1">{q.label}</p>
                    {flagMap[q.key] && flagMap[q.key].size > 0 && (
                      <QuestionFlags activeFlags={flagMap[q.key]} readOnly />
                    )}
                  </div>
                  <p className="text-sm font-light leading-relaxed whitespace-pre-wrap">
                    {soulMap[q.key]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="py-8 border-t border-gray-200 text-center">
          <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-4">
            High, Low, Buffalo Architecture PLLC
          </p>
          <p className="text-xs font-light text-gray-400">
            highlowbuffalo.co
          </p>
        </div>
      </div>
    </div>
  );
}
