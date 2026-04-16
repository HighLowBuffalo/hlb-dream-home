import { describe, it, expect } from "vitest";
import { buildSpaceTable } from "@/lib/report/buildSpaceTable";

describe("buildSpaceTable — classification", () => {
  it("garage is always detached regardless of override", () => {
    const { detached } = buildSpaceTable({
      beds: "3",
      baths: "2",
      garageCount: "2",
    });
    const garage = detached.find((s) => s.name.includes("Garage"));
    expect(garage).toBeDefined();
    expect(garage!.attached).toBe(false);
  });

  it("outdoor pool + covered patio land in detached group", () => {
    const { detached, mainHouse } = buildSpaceTable({
      beds: "3",
      baths: "2",
      outdoor: "Covered patio",
      outdoorPool: "Pool",
    });
    const poolInDetached = detached.some((s) => s.name === "Pool");
    const patioInDetached = detached.some((s) => s.name.includes("Patio"));
    const poolInAttached = mainHouse.some((s) => s.name === "Pool");
    expect(poolInDetached).toBe(true);
    expect(patioInDetached).toBe(true);
    expect(poolInAttached).toBe(false);
  });

  it("home office defaults to attached when no detached cue", () => {
    const { mainHouse, detached } = buildSpaceTable({
      beds: "3",
      baths: "2",
      office: "Yes, one person office",
    });
    expect(mainHouse.some((s) => s.name === "Home Office")).toBe(true);
    expect(detached.some((s) => s.name === "Home Office")).toBe(false);
  });

  it("home office flips to detached via officeLocation override", () => {
    const { mainHouse, detached } = buildSpaceTable({
      beds: "3",
      baths: "2",
      office: "Yes, one person office",
      officeLocation: "detached",
    });
    expect(detached.some((s) => s.name === "Home Office")).toBe(true);
    expect(mainHouse.some((s) => s.name === "Home Office")).toBe(false);
  });

  it("home office flips to detached when the office answer itself mentions 'detached'", () => {
    // Fallback path for LLM missing the explicit *Location extraction
    // or for historical data pre-override-key.
    const { mainHouse, detached } = buildSpaceTable({
      beds: "3",
      baths: "2",
      office: "Yes, home office needed in a detached building",
    });
    expect(detached.some((s) => s.name === "Home Office")).toBe(true);
    expect(mainHouse.some((s) => s.name === "Home Office")).toBe(false);
  });

  it("in-law suite defaults to attached, flips on inLawSuiteLocation=detached", () => {
    const attachedResult = buildSpaceTable({
      beds: "4",
      baths: "3",
      specialRooms: "In-law suite",
    });
    expect(
      attachedResult.mainHouse.some((s) => s.name === "In-Law Suite")
    ).toBe(true);

    const detachedResult = buildSpaceTable({
      beds: "4",
      baths: "3",
      specialRooms: "In-law suite",
      inLawSuiteLocation: "detached",
    });
    expect(
      detachedResult.detached.some((s) => s.name === "In-Law Suite")
    ).toBe(true);
    expect(
      detachedResult.mainHouse.some((s) => s.name === "In-Law Suite")
    ).toBe(false);
  });

  it("totals sum each group correctly and mainHouse + detached = total", () => {
    const result = buildSpaceTable({
      beds: "3",
      baths: "2",
      garageCount: "2",
      outdoor: "Covered patio",
      outdoorPool: "Pool",
    });
    const mainSum = result.mainHouse.reduce((s, x) => s + x.sqft, 0);
    const detSum = result.detached.reduce((s, x) => s + x.sqft, 0);
    expect(result.mainHouseSqft).toBe(mainSum);
    expect(result.detachedSqft).toBe(detSum);
    expect(result.totalSqft).toBe(mainSum + detSum);
  });

  it("regression: PDF example — detached items not counted in main house total", () => {
    // Reproduces the user's reported bug: a 4-bed, 4.5-bath submission with
    // detached office + 4-car garage + covered patio + pool should put all
    // four in the detached subtotal, not lumped into a single Total.
    const { mainHouse, detached } = buildSpaceTable({
      beds: "4",
      baths: "4.5",
      garageCount: "4",
      office: "Yes, home office needed in a detached building",
      outdoor: "Covered patio",
      outdoorPool: "Pool",
    });

    // These should all be in detached, never main house
    const mustBeDetached = ["Home Office", "Garage", "Patio", "Pool"];
    for (const name of mustBeDetached) {
      const inDetached = detached.some((s) => s.name.includes(name));
      const inMain = mainHouse.some((s) => s.name.includes(name));
      expect(inDetached, `${name} should be in detached`).toBe(true);
      expect(inMain, `${name} should NOT be in main house`).toBe(false);
    }
  });
});

describe("buildSpaceTable — resilience", () => {
  it("handles empty answers object without throwing", () => {
    expect(() => buildSpaceTable({})).not.toThrow();
  });

  it("returns non-negative totals for all answer combinations", () => {
    const { mainHouseSqft, detachedSqft, totalSqft } = buildSpaceTable({});
    expect(mainHouseSqft).toBeGreaterThanOrEqual(0);
    expect(detachedSqft).toBeGreaterThanOrEqual(0);
    expect(totalSqft).toBe(mainHouseSqft + detachedSqft);
  });
});
