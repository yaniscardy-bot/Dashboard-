import type { Habit, HabitLog, StreakResult } from "@/types/domain";
import { addDays, eachDate, isoWeekKey, toDateKey } from "./date-utils";

/**
 * Algorithme de grâce : une série tolère au plus 1 manquement par fenêtre
 * glissante de 7 jours dus (daily / specific_weekdays) ou par fenêtre de
 * 4 semaines (weekly_count). La fenêtre est évaluée à chaque manquement,
 * sur les jours/semaines dus précédents (pas calendaires) — un 2e
 * manquement dans les 6 unités dues précédentes casse la série ; un
 * 1er manquement isolé la laisse intacte (ni incrémentée, ni cassée).
 */
const GRACE_WINDOW_DAILY = 7;
const GRACE_WINDOW_WEEKLY = 4;

function isDueDay(habit: Habit, date: Date): boolean {
  if (habit.frequencyType === "daily") return true;
  if (habit.frequencyType === "specific_weekdays") {
    return (habit.frequencyWeekdays ?? []).includes(date.getDay());
  }
  return false; // weekly_count n'a pas de notion de "jour dû"
}

/** Simule l'accumulation de série sur une séquence d'issues (hit=true), avec grâce. */
function simulateStreak(outcomes: boolean[], windowSize: number) {
  let streak = 0;
  let longest = 0;
  const trailing: boolean[] = [];
  let graceUsedAtEnd = false;

  for (const hit of outcomes) {
    if (hit) {
      streak += 1;
      graceUsedAtEnd = false;
    } else {
      const priorMisses = trailing
        .slice(-(windowSize - 1))
        .filter((h) => h === false).length;
      if (priorMisses >= 1) {
        streak = 0;
        graceUsedAtEnd = false;
      } else {
        graceUsedAtEnd = true; // grâce consommée, streak inchangée
      }
    }
    trailing.push(hit);
    if (trailing.length > windowSize) trailing.shift();
    longest = Math.max(longest, streak);
  }

  return { current: streak, longest, graceUsedAtEnd };
}

function computeDailyLikeStreak(
  habit: Habit,
  logs: HabitLog[],
  asOf: Date
): StreakResult {
  const createdAt = new Date(habit.createdAt);
  const start = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
  const today = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());

  const logsByDate = new Map(logs.map((l) => [l.logDate, l]));

  if (start.getTime() > today.getTime()) {
    return { currentStreak: 0, longestStreak: 0, graceUsedThisWindow: false, isAtRisk: false };
  }

  const dueDates = eachDate(start, today).filter((d) => isDueDay(habit, d));
  const outcomes = dueDates.map((d) => logsByDate.get(toDateKey(d))?.completed === true);

  const { current, longest, graceUsedAtEnd } = simulateStreak(outcomes, GRACE_WINDOW_DAILY);

  const isAtRisk = isDueDay(habit, today) && logsByDate.get(toDateKey(today))?.completed !== true;

  return { currentStreak: current, longestStreak: longest, graceUsedThisWindow: graceUsedAtEnd, isAtRisk };
}

function computeWeeklyCountStreak(
  habit: Habit,
  logs: HabitLog[],
  asOf: Date
): StreakResult {
  const target = habit.frequencyTarget ?? 1;
  const createdAt = new Date(habit.createdAt);
  const currentWeekKey = isoWeekKey(asOf);

  // Compte les logs complétés par semaine ISO.
  const countByWeek = new Map<string, number>();
  for (const log of logs) {
    if (!log.completed) continue;
    const week = isoWeekKey(new Date(log.logDate));
    countByWeek.set(week, (countByWeek.get(week) ?? 0) + 1);
  }

  // Semaines dues : de la semaine de création jusqu'à la semaine précédant
  // la semaine en cours (la semaine en cours n'est pas encore "jouée").
  const weeks: string[] = [];
  let cursor = new Date(createdAt);
  cursor = addDays(cursor, -((cursor.getDay() + 6) % 7)); // lundi de la semaine de création
  const currentWeekStart = new Date(asOf);
  const guardLimit = 5200; // ~100 ans de semaines, garde-fou anti-boucle infinie
  let i = 0;
  while (isoWeekKey(cursor) !== currentWeekKey && i < guardLimit) {
    weeks.push(isoWeekKey(cursor));
    cursor = addDays(cursor, 7);
    i += 1;
  }
  void currentWeekStart;

  const outcomes = weeks.map((w) => (countByWeek.get(w) ?? 0) >= target);
  const { current, longest, graceUsedAtEnd } = simulateStreak(outcomes, GRACE_WINDOW_WEEKLY);

  const currentWeekCount = countByWeek.get(currentWeekKey) ?? 0;
  const isAtRisk = currentWeekCount < target;

  return { currentStreak: current, longestStreak: longest, graceUsedThisWindow: graceUsedAtEnd, isAtRisk };
}

export function computeHabitStreak(
  habit: Habit,
  logs: HabitLog[],
  asOf: Date = new Date()
): StreakResult {
  const habitLogs = logs.filter((l) => l.habitId === habit.id);
  if (habit.frequencyType === "weekly_count") {
    return computeWeeklyCountStreak(habit, habitLogs, asOf);
  }
  return computeDailyLikeStreak(habit, habitLogs, asOf);
}
