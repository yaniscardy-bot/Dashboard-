import { describe, expect, it } from "vitest";
import { computeTrend } from "./trend";

describe("computeTrend", () => {
  it("is flat with fewer than 2 points", () => {
    expect(computeTrend([])).toEqual({ delta: 0, direction: "flat", currentAverage: 0, previousAverage: 0 });
    expect(computeTrend([42])).toEqual({ delta: 0, direction: "flat", currentAverage: 42, previousAverage: 42 });
  });

  it("detects an upward trend", () => {
    // moitié précédente [50,50], moitié récente [90,90] -> delta +40
    const result = computeTrend([50, 50, 90, 90]);
    expect(result.direction).toBe("up");
    expect(result.delta).toBe(40);
    expect(result.previousAverage).toBe(50);
    expect(result.currentAverage).toBe(90);
  });

  it("detects a downward trend", () => {
    const result = computeTrend([90, 90, 50, 50]);
    expect(result.direction).toBe("down");
    expect(result.delta).toBe(-40);
  });

  it("stays flat within the +-1 threshold", () => {
    const result = computeTrend([70, 70, 71, 70]);
    expect(result.direction).toBe("flat");
  });

  it("drops the oldest point on an odd-length series", () => {
    // longueur 5 -> half=2, recent = 2 derniers, previous = les 2 avant, le tout premier est ignoré
    const result = computeTrend([0, 100, 100, 80, 80]);
    expect(result.previousAverage).toBe(100);
    expect(result.currentAverage).toBe(80);
  });
});
