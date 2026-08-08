import { describe, expect, it } from "vitest";
import { toCSV } from "./csv";
import type { ExportBundle } from "./json";

function bundle(overrides: Partial<ExportBundle> = {}): ExportBundle {
  return {
    exportedAt: "2026-01-01T00:00:00.000Z",
    habits: [],
    metrics: [],
    habitLogs: [],
    metricLogs: [],
    ...overrides,
  };
}

describe("toCSV", () => {
  it("emits only the header row when there is no data", () => {
    expect(toCSV(bundle())).toBe("date,type,name,value,unit");
  });

  it("emits one row per habit log, resolving the habit name", () => {
    const result = toCSV(
      bundle({
        habits: [{ id: "h1", userId: "u", name: "Sport", icon: null, color: null, frequencyType: "daily", frequencyTarget: null, frequencyWeekdays: null, archived: false, sortOrder: 0, createdAt: "" }],
        habitLogs: [{ id: "l1", habitId: "h1", userId: "u", logDate: "2026-01-10", completed: true, note: null, createdAt: "", updatedAt: "" }],
      })
    );
    expect(result).toBe("date,type,name,value,unit\n2026-01-10,habit,Sport,1,");
  });

  it("emits one row per metric log with its unit", () => {
    const result = toCSV(
      bundle({
        metrics: [{ id: "m1", userId: "u", name: "Sommeil", icon: null, unit: "h", targetValue: 7.5, targetDirection: "at_least", decimals: 1, color: null, archived: false, sortOrder: 0, createdAt: "" }],
        metricLogs: [{ id: "l1", metricId: "m1", userId: "u", logDate: "2026-01-10", value: 8, createdAt: "", updatedAt: "" }],
      })
    );
    expect(result).toBe("date,type,name,value,unit\n2026-01-10,metric,Sommeil,8,h");
  });

  it("quotes fields containing a comma", () => {
    const result = toCSV(
      bundle({
        habits: [{ id: "h1", userId: "u", name: "Sport, cardio", icon: null, color: null, frequencyType: "daily", frequencyTarget: null, frequencyWeekdays: null, archived: false, sortOrder: 0, createdAt: "" }],
        habitLogs: [{ id: "l1", habitId: "h1", userId: "u", logDate: "2026-01-10", completed: true, note: null, createdAt: "", updatedAt: "" }],
      })
    );
    expect(result).toContain('"Sport, cardio"');
  });
});
