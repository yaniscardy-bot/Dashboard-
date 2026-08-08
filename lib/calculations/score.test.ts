import { describe, expect, it } from "vitest";
import { computeDayScore, computeScoreSeries } from "./score";
import type { Habit, HabitLog, Metric, MetricLog } from "@/types/domain";

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    userId: "u1",
    name: "Sport",
    icon: null,
    color: null,
    frequencyType: "daily",
    frequencyTarget: null,
    frequencyWeekdays: null,
    archived: false,
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function habitLog(overrides: Partial<HabitLog> = {}): HabitLog {
  return {
    id: "hl1",
    habitId: "h1",
    userId: "u1",
    logDate: "2026-01-10",
    completed: true,
    note: null,
    createdAt: "2026-01-10T00:00:00.000Z",
    updatedAt: "2026-01-10T00:00:00.000Z",
    ...overrides,
  };
}

function metric(overrides: Partial<Metric> = {}): Metric {
  return {
    id: "m1",
    userId: "u1",
    name: "Sommeil",
    icon: null,
    unit: "h",
    targetValue: 7.5,
    targetDirection: "at_least",
    decimals: 1,
    color: null,
    archived: false,
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function metricLog(overrides: Partial<MetricLog> = {}): MetricLog {
  return {
    id: "ml1",
    metricId: "m1",
    userId: "u1",
    logDate: "2026-01-10",
    value: 8,
    createdAt: "2026-01-10T00:00:00.000Z",
    updatedAt: "2026-01-10T00:00:00.000Z",
    ...overrides,
  };
}

describe("computeDayScore", () => {
  it("returns 0/0/0 when there is nothing to score", () => {
    const result = computeDayScore({ habits: [], habitLogsForDay: [], metrics: [], metricLogsForDay: [] });
    expect(result).toEqual({ done: 0, total: 0, score: 0 });
  });

  it("counts a completed habit and ignores archived habits", () => {
    const result = computeDayScore({
      habits: [habit(), habit({ id: "h2", archived: true })],
      habitLogsForDay: [habitLog()],
      metrics: [],
      metricLogsForDay: [],
    });
    expect(result).toEqual({ done: 1, total: 1, score: 100 });
  });

  it("handles at_least / at_most / exact metric directions", () => {
    const atLeast = metric({ id: "m1", targetDirection: "at_least", targetValue: 7 });
    const atMost = metric({ id: "m2", targetDirection: "at_most", targetValue: 3 });
    const exact = metric({ id: "m3", targetDirection: "exact", targetValue: 10, decimals: 0 });

    const result = computeDayScore({
      habits: [],
      habitLogsForDay: [],
      metrics: [atLeast, atMost, exact],
      metricLogsForDay: [
        metricLog({ id: "l1", metricId: "m1", value: 8 }), // 8 >= 7 -> atteint
        metricLog({ id: "l2", metricId: "m2", value: 5 }), // 5 <= 3 -> non atteint
        metricLog({ id: "l3", metricId: "m3", value: 10 }), // exact -> atteint
      ],
    });
    expect(result).toEqual({ done: 2, total: 3, score: 67 });
  });

  it("excludes metrics without a target from the total", () => {
    const result = computeDayScore({
      habits: [],
      habitLogsForDay: [],
      metrics: [metric({ targetValue: null, targetDirection: null })],
      metricLogsForDay: [metricLog({ value: 100 })],
    });
    expect(result).toEqual({ done: 0, total: 0, score: 0 });
  });

  it("does not count a metric with no logged value", () => {
    const result = computeDayScore({
      habits: [],
      habitLogsForDay: [],
      metrics: [metric()],
      metricLogsForDay: [],
    });
    expect(result).toEqual({ done: 0, total: 1, score: 0 });
  });
});

describe("computeScoreSeries", () => {
  it("produces one point per day in the range, flagging days with data", () => {
    const series = computeScoreSeries({
      habits: [habit()],
      metrics: [],
      habitLogs: [habitLog({ logDate: "2026-01-02" })],
      metricLogs: [],
      from: "2026-01-01",
      to: "2026-01-03",
    });
    expect(series).toEqual([
      { date: "2026-01-01", score: 0, hasData: false },
      { date: "2026-01-02", score: 100, hasData: true },
      { date: "2026-01-03", score: 0, hasData: false },
    ]);
  });
});
