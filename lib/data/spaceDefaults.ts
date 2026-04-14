export interface SpaceDefault {
  dims: string;
  sqft: number;
}

export const SPACE_DEFAULTS: Record<string, SpaceDefault> = {
  foyer:          { dims: "10' \u00d7 12'", sqft: 120 },
  living:         { dims: "18' \u00d7 24'", sqft: 432 },
  diningSmall:    { dims: "14' \u00d7 18'", sqft: 252 },
  diningLarge:    { dims: "16' \u00d7 20'", sqft: 320 },
  kitchen:        { dims: "16' \u00d7 20'", sqft: 320 },
  butlersPantry:  { dims: "10' \u00d7 14'", sqft: 140 },
  mudroom:        { dims: "10' \u00d7 12'", sqft: 120 },
  laundry:        { dims: "10' \u00d7 12'", sqft: 120 },
  primaryBed:     { dims: "16' \u00d7 20'", sqft: 320 },
  primaryBath:    { dims: "12' \u00d7 18'", sqft: 216 },
  primaryCloset:  { dims: "12' \u00d7 14'", sqft: 168 },
  bedroom:        { dims: "12' \u00d7 14'", sqft: 168 },
  ensuiteBath:    { dims: "6' \u00d7 10'",  sqft: 60 },
  sharedBath:     { dims: "8' \u00d7 10'",  sqft: 80 },
  powderBath:     { dims: "5' \u00d7 7'",   sqft: 35 },
  office:         { dims: "12' \u00d7 14'", sqft: 168 },
  gym:            { dims: "14' \u00d7 18'", sqft: 252 },
  mediaRoom:      { dims: "16' \u00d7 20'", sqft: 320 },
  library:        { dims: "12' \u00d7 14'", sqft: 168 },
  wineCellar:     { dims: "8' \u00d7 10'",  sqft: 80 },
  playroom:       { dims: "12' \u00d7 14'", sqft: 168 },
  inLawSuite:     { dims: "14' \u00d7 16'", sqft: 224 },
  garage1:        { dims: "14' \u00d7 22'", sqft: 480 },
  garage2:        { dims: "24' \u00d7 30'", sqft: 720 },
  garage3:        { dims: "36' \u00d7 30'", sqft: 1080 },
  coveredPatio:   { dims: "20' \u00d7 30'", sqft: 600 },
  outdoorKitchen: { dims: "10' \u00d7 16'", sqft: 160 },
  pool:           { dims: "16' \u00d7 36'", sqft: 576 },
  hotTub:         { dims: "8' \u00d7 8'",   sqft: 64 },
  firePit:        { dims: "20' \u00d7 20'", sqft: 400 },
  sportCourt:     { dims: "30' \u00d7 60'", sqft: 1800 },
};
