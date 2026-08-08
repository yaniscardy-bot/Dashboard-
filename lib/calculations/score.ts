import type { DayScoreResult, Habit, HabitLog, Metric, MetricLog } from "@/types/domain";
import { eachDate, toDateKey } from "./date-utils";

function metricReached(metric: Metric, value: number): boolean {
  if (metric.targetValue === null || metric.targetDirection === null) return false;
  switch (metric.targetDirection) {
    case "at_least":
      return value >= metric.targetValue;
    case "at_most":
      return value <= metric.targetValue;
    case "exact": {
      const factor = 10 ** metric.decimals;
      return Math.round(value * factor) === Math.round(metric.targetValue * factor);
    }
  }
}

/**
 * Score d'un jour = pourcentage d'objectifs atteints parmi les habitudes
 * (non archivées) cochées ce jour-là et les métriques (non archivées, avec
 * cible définie) ayant atteint leur cible ce jour-là. Une métrique sans
 * cible ne compte pas dans le total (rien à "réussir").
 */
export function computeDayScore(params: {
  habits: Habit[];
  habitLogsForDay: HabitLog[];
  metrics: Metric[];
  metricLogsForDay: MetricLog[];
}): DayScoreResult {
  const { habits, habitLogsForDay, metrics, metricLogsForDay } = params;

  const activeHabits = habits.filter((h) => !h.archived);
  const completedHabitIds = new Set(
    habitLogsForDay.filter((l) => l.completed).map((l) => l.habitId)
  );
  const habitsDone = activeHabits.filter((h) => completedHabitIds.has(h.id)).length;

  const scorableMetrics = metrics.filter((m) => !m.archived && m.targetValue !== null);
  const valueByMetricId = new Map(metricLogsForDay.map((l) => [l.metricId, l.value]));
  const metricsDone = scorableMetrics.filter((m) => {
    const value = valueByMetricId.get(m.id);
    return value !== undefined && metricReached(m, value);
  }).length;

  const total = activeHabits.length + scorableMetrics.length;
  const done = habitsDone + metricsDone;

  return { done, total, score: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export interface DayScorePoint {
  date: string;
  score: number;
  hasData: boolean;
}

/**
 * Calcule le score de chaque jour entre `from` et `to` (inclus). `hasData`
 * distingue un jour sans aucune donnée (score affiché à 0 par convention,
 * mais pas "raté") d'un jour où l'utilisateur a effectivement journalisé
 * quelque chose — utile pour la heatmap du calendrier.
 */
export function computeScoreSeries(params: {
  habits: Habit[];
  metrics: Metric[];
  habitLogs: HabitLog[];
  metricLogs: MetricLog[];
  from: string;
  to: string;
}): DayScorePoint[] {
  const { habits, metrics, habitLogs, metricLogs, from, to } = params;

  const habitLogsByDate = new Map<string, HabitLog[]>();
  for (const log of habitLogs) {
    const list = habitLogsByDate.get(log.logDate) ?? [];
    list.push(log);
    habitLogsByDate.set(log.logDate, list);
  }

  const metricLogsByDate = new Map<string, MetricLog[]>();
  for (const log of metricLogs) {
    const list = metricLogsByDate.get(log.logDate) ?? [];
    list.push(log);
    metricLogsByDate.set(log.logDate, list);
  }

  return eachDate(new Date(from), new Date(to)).map((d) => {
    const date = toDateKey(d);
    const habitLogsForDay = habitLogsByDate.get(date) ?? [];
    const metricLogsForDay = metricLogsByDate.get(date) ?? [];
    const { score } = computeDayScore({ habits, habitLogsForDay, metrics, metricLogsForDay });
    return { date, score, hasData: habitLogsForDay.length > 0 || metricLogsForDay.length > 0 };
  });
}
