import { describe, expect, it } from "vitest";
import { average, rollingAverage } from "./averages";

describe("average", () => {
  it("ignores null entries", () => {
    expect(average([10, null, 20, null])).toBe(15);
  });

  it("returns null when everything is null", () => {
    expect(average([null, null])).toBeNull();
  });

  it("returns null for an empty array", () => {
    expect(average([])).toBeNull();
  });
});

describe("rollingAverage", () => {
  it("treats missing days as gaps, not zeros", () => {
    // fenêtre de 3 : au 3e point, seuls deux points sont réels (10 et 20) -> moyenne 15, pas 10
    const result = rollingAverage([10, null, 20], 3);
    expect(result).toEqual([10, 10, 15]);
  });

  it("produces null for a window entirely without data", () => {
    const result = rollingAverage([null, null, null], 2);
    expect(result).toEqual([null, null, null]);
  });

  it("matches a plain average once the window is fully populated", () => {
    const result = rollingAverage([10, 20, 30, 40], 2);
    expect(result).toEqual([10, 15, 25, 35]);
  });

  it("throws on a non-positive window size", () => {
    expect(() => rollingAverage([1, 2], 0)).toThrow();
  });
});
