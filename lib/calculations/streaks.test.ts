import { describe, expect, it } from "vitest";
import { computeHabitStreak } from "./streaks";
import { addDays, toDateKey } from "./date-utils";
import type { Habit, HabitLog } from "@/types/domain";

function baseHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    userId: "u1",
    name: "Test",
    icon: null,
    color: null,
    frequencyType: "daily",
    frequencyTarget: null,
    frequencyWeekdays: null,
    archived: false,
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000",
    ...overrides,
  };
}

function log(habitId: string, date: Date, completed = true): HabitLog {
  return {
    id: `${habitId}-${toDateKey(date)}`,
    habitId,
    userId: "u1",
    logDate: toDateKey(date),
    completed,
    note: null,
    createdAt: date.toISOString(),
    updatedAt: date.toISOString(),
  };
}

describe("computeHabitStreak — daily", () => {
  const start = new Date(2026, 0, 1); // 1er janvier 2026

  it("counts a perfect run with no misses", () => {
    const asOf = addDays(start, 9); // 10 jours dus
    const habit = baseHabit({ createdAt: start.toISOString() });
    const logs = Array.from({ length: 10 }, (_, i) => log(habit.id, addDays(start, i)));

    const result = computeHabitStreak(habit, logs, asOf);
    expect(result.currentStreak).toBe(10);
    expect(result.longestStreak).toBe(10);
    expect(result.isAtRisk).toBe(false);
  });

  it("tolerates exactly one miss per 7-day window (grace) without breaking the streak", () => {
    const habit = baseHabit({ createdAt: start.toISOString() });
    const days = Array.from({ length: 10 }, (_, i) => addDays(start, i));
    // jour index 5 (le 6e jour) manqué, tous les autres complétés
    const logs = days
      .filter((_, i) => i !== 5)
      .map((d) => log(habit.id, d));

    const asOf = days[9];
    const result = computeHabitStreak(habit, logs, asOf);
    expect(result.currentStreak).toBe(9);
    expect(result.longestStreak).toBe(9);
  });

  it("breaks the streak on a second miss within the same 7-day window", () => {
    const habit = baseHabit({ createdAt: start.toISOString() });
    const days = Array.from({ length: 10 }, (_, i) => addDays(start, i));
    // jours index 5 et 6 manqués (2 manquements dans la même fenêtre de 7)
    const logs = days
      .filter((_, i) => i !== 5 && i !== 6)
      .map((d) => log(habit.id, d));

    const asOf = days[9];
    const result = computeHabitStreak(habit, logs, asOf);
    // streak retombe à 0 au 2e manquement (jour 7), puis jours 8,9,10 -> 3
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(5);
  });

  it("flags isAtRisk when today is due and not yet logged", () => {
    const habit = baseHabit({ createdAt: start.toISOString() });
    const asOf = addDays(start, 3);
    const logs = [log(habit.id, start), log(habit.id, addDays(start, 1))];

    const result = computeHabitStreak(habit, logs, asOf);
    expect(result.isAtRisk).toBe(true);
  });

  it("returns zeros when the habit did not exist yet at asOf", () => {
    const habit = baseHabit({ createdAt: addDays(start, 5).toISOString() });
    const result = computeHabitStreak(habit, [], start);
    expect(result).toEqual({ currentStreak: 0, longestStreak: 0, graceUsedThisWindow: false, isAtRisk: false });
  });
});

describe("computeHabitStreak — specific_weekdays", () => {
  it("only counts due weekdays, ignoring logs on non-due days", () => {
    const day0 = new Date(2026, 0, 5);
    const weekday = day0.getDay();
    const habit = baseHabit({
      frequencyType: "specific_weekdays",
      frequencyWeekdays: [weekday],
      createdAt: day0.toISOString(),
    });

    const dueDates = [0, 7, 14, 21, 28].map((n) => addDays(day0, n));
    const logs = dueDates.map((d) => log(habit.id, d));
    // bruit : une complétion sur un jour NON dû, ne doit rien changer
    logs.push(log(habit.id, addDays(day0, 3)));

    const asOf = dueDates[dueDates.length - 1];
    const result = computeHabitStreak(habit, logs, asOf);
    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(5);
  });
});

describe("computeHabitStreak — weekly_count", () => {
  function mondayOf(date: Date): Date {
    return addDays(date, -((date.getDay() + 6) % 7));
  }

  it("counts consecutive weeks meeting the target, excluding the in-progress current week", () => {
    const monday0 = mondayOf(new Date(2026, 0, 5));
    const habit = baseHabit({
      frequencyType: "weekly_count",
      frequencyTarget: 3,
      createdAt: monday0.toISOString(),
    });

    const logs = [0, 7, 14].flatMap((weekOffset) =>
      [0, 1, 2].map((dayOffset) => log(habit.id, addDays(monday0, weekOffset + dayOffset)))
    );

    const asOf = addDays(monday0, 21); // lundi de la 4e semaine, en cours
    const result = computeHabitStreak(habit, logs, asOf);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.isAtRisk).toBe(true); // semaine en cours : 0/3 pour l'instant
  });

  it("tolerates one under-target week per 4-week window, breaks on a second", () => {
    const monday0 = mondayOf(new Date(2026, 0, 5));
    const habit = baseHabit({
      frequencyType: "weekly_count",
      frequencyTarget: 3,
      createdAt: monday0.toISOString(),
    });

    const logs = [
      ...[0, 1, 2].map((d) => log(habit.id, addDays(monday0, d))), // semaine 1 : 3/3, atteint
      log(habit.id, addDays(monday0, 7)), // semaine 2 : 1/3, manqué (grâce)
      ...[14, 15, 16].map((d) => log(habit.id, addDays(monday0, d))), // semaine 3 : 3/3, atteint
    ];

    const asOf = addDays(monday0, 21); // semaine 4, en cours
    const result = computeHabitStreak(habit, logs, asOf);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });
});
