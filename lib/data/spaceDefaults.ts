export interface SpaceDefault {
  dims: string;
  sqft: number;
  /**
   * Whether this space is conditioned / part of the main house by default.
   *
   * Some spaces are categorically detached/outdoor (garage, pool, patio).
   * Others default to attached but a client can override via an explicit
   * *Location answer key (e.g. answers.officeLocation = "detached").
   * See lib/report/buildSpaceTable.ts for the override logic.
   */
  attached: boolean;
}

export const SPACE_DEFAULTS: Record<string, SpaceDefault> = {
  // --- Main house (always attached) ---
  foyer:          { dims: "10' \u00d7 12'", sqft: 120, attached: true },
  living:         { dims: "18' \u00d7 24'", sqft: 432, attached: true },
  diningSmall:    { dims: "14' \u00d7 18'", sqft: 252, attached: true },
  diningLarge:    { dims: "16' \u00d7 20'", sqft: 320, attached: true },
  kitchen:        { dims: "16' \u00d7 20'", sqft: 320, attached: true },
  butlersPantry:  { dims: "10' \u00d7 14'", sqft: 140, attached: true },
  mudroom:        { dims: "10' \u00d7 12'", sqft: 120, attached: true },
  laundry:        { dims: "10' \u00d7 12'", sqft: 120, attached: true },
  primaryBed:     { dims: "16' \u00d7 20'", sqft: 320, attached: true },
  primaryBath:    { dims: "12' \u00d7 18'", sqft: 216, attached: true },
  primaryCloset:  { dims: "12' \u00d7 14'", sqft: 168, attached: true },
  bedroom:        { dims: "12' \u00d7 14'", sqft: 168, attached: true },
  ensuiteBath:    { dims: "6' \u00d7 10'",  sqft: 60,  attached: true },
  sharedBath:     { dims: "8' \u00d7 10'",  sqft: 80,  attached: true },
  powderBath:     { dims: "5' \u00d7 7'",   sqft: 35,  attached: true },
  gym:            { dims: "14' \u00d7 18'", sqft: 252, attached: true },
  mediaRoom:      { dims: "16' \u00d7 20'", sqft: 320, attached: true },
  library:        { dims: "12' \u00d7 14'", sqft: 168, attached: true },
  wineCellar:     { dims: "8' \u00d7 10'",  sqft: 80,  attached: true },
  playroom:       { dims: "12' \u00d7 14'", sqft: 168, attached: true },

  // --- Conditionally attached (override via *Location answer key) ---
  // Default: part of main house. Override path:
  //   answers.officeLocation    = "detached" → detached
  //   answers.inLawSuiteLocation = "detached" → detached
  office:         { dims: "12' \u00d7 14'", sqft: 168, attached: true },
  inLawSuite:     { dims: "14' \u00d7 16'", sqft: 224, attached: true },

  // --- Always detached / outdoor ---
  garage1:        { dims: "14' \u00d7 22'", sqft: 480,  attached: false },
  garage2:        { dims: "24' \u00d7 30'", sqft: 720,  attached: false },
  garage3:        { dims: "36' \u00d7 30'", sqft: 1080, attached: false },
  coveredPatio:   { dims: "20' \u00d7 30'", sqft: 600,  attached: false },
  outdoorKitchen: { dims: "10' \u00d7 16'", sqft: 160,  attached: false },
  pool:           { dims: "16' \u00d7 36'", sqft: 576,  attached: false },
  hotTub:         { dims: "8' \u00d7 8'",   sqft: 64,   attached: false },
  firePit:        { dims: "20' \u00d7 20'", sqft: 400,  attached: false },
  sportCourt:     { dims: "30' \u00d7 60'", sqft: 1800, attached: false },
};
