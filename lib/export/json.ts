import type { Habit, HabitLog, Metric, MetricLog } from "@/types/domain";

export interface ExportBundle {
  exportedAt: string;
  habits: Habit[];
  metrics: Metric[];
  habitLogs: HabitLog[];
  metricLogs: MetricLog[];
}

export function toJSON(bundle: ExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}
