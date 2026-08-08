import type { DayScoreResult, Habit, HabitLog, Metric, MetricLog } from "@/types/domain";

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
