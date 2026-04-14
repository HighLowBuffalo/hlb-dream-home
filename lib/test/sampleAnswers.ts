/**
 * Sample test answers from Levi Buttrill's first test run (2026-04-13).
 * Used for seeding the chat interface, testing report generation,
 * and verifying the docx export.
 */

export const SAMPLE_PROGRAM_ANSWERS: Record<string, string> = {
  name: "Levi Buttrill",
  address: "Wash Park",
  projectName: "Levi's Dream House",
  projectType: "New construction",
  beds: "3",
  baths: "3",
  guests: "Often",
  primaryBed: "king bed and desk",
  primaryBedMore: "reading nook, seakret room, dog cage, and lamp",
  primaryBath: "big bath tub",
  primaryBathMore: "heated floors and mister",
  primaryCloset: "boyish and easy to orginize",
  guestBeds: "room for fiends/ painting",
  kitchen: "hanging fruit holders and long cabnets",
  kitchenUsage: "We entertain and cook a lot",
  kitchenFeatures: "Large island, Bar seating, Walk-in pantry",
  kitchenMore: "cook book holder",
  kitchenAdj: "Outdoor patio",
  dining: "4",
  diningSeats: "8",
  diningNotes: "pretty",
  diningMore: "butler pantry",
  // Levi stopped here — remaining questions unanswered
};

export const SAMPLE_SUBMISSION = {
  projectName: "Levi's Dream House",
  clientName: "Levi Buttrill",
  address: "Wash Park",
  projectType: "New construction" as const,
};
