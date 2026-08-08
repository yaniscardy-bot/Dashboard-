import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchHabitLogsInRange, fetchMetricLogsInRange } from "@/lib/queries/logs";

export function habitLogsKey(from: string, to: string) {
  return ["habit-logs", from, to] as const;
}

export function metricLogsKey(from: string, to: string) {
  return ["metric-logs", from, to] as const;
}

export function useHabitLogsForDay(date: string) {
  return useQuery({
    queryKey: habitLogsKey(date, date),
    queryFn: () => fetchHabitLogsInRange(createClient(), date, date),
  });
}

export function useMetricLogsForDay(date: string) {
  return useQuery({
    queryKey: metricLogsKey(date, date),
    queryFn: () => fetchMetricLogsInRange(createClient(), date, date),
  });
}

export function useHabitLogsInRange(from: string, to: string) {
  return useQuery({
    queryKey: habitLogsKey(from, to),
    queryFn: () => fetchHabitLogsInRange(createClient(), from, to),
  });
}

export function useMetricLogsInRange(from: string, to: string) {
  return useQuery({
    queryKey: metricLogsKey(from, to),
    queryFn: () => fetchMetricLogsInRange(createClient(), from, to),
  });
}
