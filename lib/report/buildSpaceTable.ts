import { SPACE_DEFAULTS } from "@/lib/data/spaceDefaults";

/**
 * Space Program builder.
 *
 *   answers ──┐
 *             ├─▶ classify each space:
 *   SPACE_    │     1. SPACE_DEFAULTS[key].attached (baseline)
 *   DEFAULTS ─┤     2. Explicit override: answers.*Location === "detached"
 *             │     3. Fallback: the matching program answer text contains
 *             │                 the word "detached" (robust to LLM missing
 *             │                 the explicit *Location extraction and to
 *             │                 historical data without overrides)
 *             │
 *             └─▶ return array of Space rows with `attached` tagged;
 *                 caller splits into subtotals and total.
 */

export interface Space {
  name: string;
  dims: string;
  sqft: number;
  attached: boolean;
}

export interface SpaceTotals {
  mainHouse: Space[];
  detached: Space[];
  mainHouseSqft: number;
  detachedSqft: number;
  totalSqft: number;
}

/**
 * Return true when the client has indicated a space is detached via either
 * an explicit *Location override or a clear mention in the primary answer.
 */
function isDetachedOverride(
  answers: Record<string, string>,
  locationKey: string,
  primaryAnswerKey: string
): boolean {
  const explicit = answers[locationKey]?.toLowerCase();
  if (explicit && explicit.includes("detached")) return true;

  const primary = answers[primaryAnswerKey]?.toLowerCase() || "";
  // Guard against negation; we only care about the literal word as a descriptor.
  // Matches "detached building", "detached office", "detached structure", etc.
  if (/\bdetached\b/.test(primary)) return true;

  return false;
}

export function buildSpaceTable(
  answers: Record<string, string>
): SpaceTotals {
  const spaces: Space[] = [];

  const push = (
    key: string,
    name: string,
    overrideDetached?: boolean
  ) => {
    const def = SPACE_DEFAULTS[key];
    if (!def) return;
    const attached = overrideDetached === true ? false : def.attached;
    spaces.push({ name, dims: def.dims, sqft: def.sqft, attached });
  };

  // --- Core main-house spaces (always included) ---
  push("foyer", "Foyer / Entry");
  push("living", "Living Room");
  push("kitchen", "Kitchen");
  push("primaryBed", "Primary Bedroom");
  push("primaryBath", "Primary Bathroom");
  push("primaryCloset", "Primary Closet");
  push("laundry", "Laundry");

  // --- Bedrooms by count ---
  const bedCount = parseInt(answers.beds || "3", 10);
  const guestBedCount = Math.max(0, bedCount - 1);
  for (let i = 0; i < guestBedCount; i++) {
    push("bedroom", `Bedroom ${i + 2}`);
  }

  // --- Bathrooms by count (minus the primary) ---
  const bathCount = parseInt(answers.baths || "2", 10);
  const otherBaths = Math.max(0, bathCount - 1);
  for (let i = 0; i < otherBaths; i++) {
    const isLast = i === otherBaths - 1;
    const key = isLast ? "powderBath" : "sharedBath";
    const name = isLast ? "Powder Bath" : `Bathroom ${i + 2}`;
    push(key, name);
  }

  // --- Dining ---
  const diningSeats = parseInt(
    answers.diningSeats || answers.dining || "6",
    10
  );
  const diningKey = diningSeats > 10 ? "diningLarge" : "diningSmall";
  const def = SPACE_DEFAULTS[diningKey];
  if (def) {
    spaces.push({
      name: "Dining Room",
      dims: def.dims,
      sqft: def.sqft,
      attached: def.attached,
    });
  }

  // --- Office (may be detached per client override) ---
  if (answers.office && answers.office.toLowerCase() !== "no") {
    const detached = isDetachedOverride(answers, "officeLocation", "office");
    push("office", "Home Office", detached);
  }

  // --- Mudroom ---
  if (answers.entryMud && answers.entryMud.toLowerCase().includes("mud")) {
    push("mudroom", "Mudroom");
  }

  // --- Special rooms from checkbox-style answer ---
  const specialMap: Record<string, { label: string; key: string }> = {
    gym: { label: "Gym / Workout Room", key: "gym" },
    workout: { label: "Gym / Workout Room", key: "gym" },
    media: { label: "Media Room", key: "mediaRoom" },
    theater: { label: "Media Room", key: "mediaRoom" },
    library: { label: "Library / Reading Room", key: "library" },
    reading: { label: "Library / Reading Room", key: "library" },
    wine: { label: "Wine Cellar", key: "wineCellar" },
    playroom: { label: "Playroom", key: "playroom" },
    "in-law": { label: "In-Law Suite", key: "inLawSuite" },
  };
  if (answers.specialRooms) {
    const selected = answers.specialRooms.toLowerCase();
    const added = new Set<string>();
    for (const [keyword, info] of Object.entries(specialMap)) {
      if (selected.includes(keyword) && !added.has(info.key)) {
        added.add(info.key);
        // In-law suite may be detached per client override.
        const override =
          info.key === "inLawSuite"
            ? isDetachedOverride(
                answers,
                "inLawSuiteLocation",
                "specialRooms"
              ) ||
              isDetachedOverride(answers, "inLawSuiteLocation", "specialMore")
            : undefined;
        push(info.key, info.label, override);
      }
    }
  }

  // --- Garage (always detached default) ---
  const garageCount = parseInt(answers.garageCount || "2", 10);
  if (garageCount > 0) {
    const garageKey =
      garageCount >= 3 ? "garage3" : garageCount === 2 ? "garage2" : "garage1";
    push(garageKey, `${garageCount}-Car Garage`);
  }

  // --- Outdoor spaces ---
  if (answers.outdoor) {
    const outdoor = answers.outdoor.toLowerCase();
    if (
      outdoor.includes("covered") ||
      outdoor.includes("patio") ||
      outdoor.includes("porch")
    ) {
      push("coveredPatio", "Covered Patio / Porch");
    }
  }
  if (
    answers.outdoorKitchen &&
    answers.outdoorKitchen.toLowerCase().includes("yes")
  ) {
    push("outdoorKitchen", "Outdoor Kitchen");
  }
  if (answers.outdoorPool) {
    const pool = answers.outdoorPool.toLowerCase();
    if (pool.includes("pool") || pool.includes("both")) {
      push("pool", "Pool");
    }
    if (pool.includes("hot tub") || pool.includes("both")) {
      push("hotTub", "Hot Tub");
    }
  }

  // --- Split into totals ---
  const mainHouse = spaces.filter((s) => s.attached);
  const detached = spaces.filter((s) => !s.attached);
  const mainHouseSqft = mainHouse.reduce((sum, s) => sum + s.sqft, 0);
  const detachedSqft = detached.reduce((sum, s) => sum + s.sqft, 0);

  return {
    mainHouse,
    detached,
    mainHouseSqft,
    detachedSqft,
    totalSqft: mainHouseSqft + detachedSqft,
  };
}
