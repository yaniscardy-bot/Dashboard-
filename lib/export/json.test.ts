import { describe, expect, it } from "vitest";
import { toJSON } from "./json";

describe("toJSON", () => {
  it("round-trips through JSON.parse with the same shape", () => {
    const bundle = {
      exportedAt: "2026-01-01T00:00:00.000Z",
      habits: [],
      metrics: [],
      habitLogs: [],
      metricLogs: [],
    };
    const parsed = JSON.parse(toJSON(bundle));
    expect(parsed).toEqual(bundle);
  });

  it("is pretty-printed (indented) for human readability", () => {
    const result = toJSON({ exportedAt: "x", habits: [], metrics: [], habitLogs: [], metricLogs: [] });
    expect(result).toContain("\n  ");
  });
});
