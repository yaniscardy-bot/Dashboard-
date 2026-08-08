import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { HabitLog, MetricLog } from "@/types/domain";

type Client = SupabaseClient<Database>;

function mapHabitLog(row: Database["public"]["Tables"]["habit_logs"]["Row"]): HabitLog {
  return {
    id: row.id,
    habitId: row.habit_id,
    userId: row.user_id,
    logDate: row.log_date,
    completed: row.completed,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMetricLog(row: Database["public"]["Tables"]["metric_logs"]["Row"]): MetricLog {
  return {
    id: row.id,
    metricId: row.metric_id,
    userId: row.user_id,
    logDate: row.log_date,
    value: row.value,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchHabitLogsInRange(supabase: Client, from: string, to: string): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from("habit_logs")
    .select("*")
    .gte("log_date", from)
    .lte("log_date", to);
  if (error) throw error;
  return data.map(mapHabitLog);
}

export async function fetchMetricLogsInRange(supabase: Client, from: string, to: string): Promise<MetricLog[]> {
  const { data, error } = await supabase
    .from("metric_logs")
    .select("*")
    .gte("log_date", from)
    .lte("log_date", to);
  if (error) throw error;
  return data.map(mapMetricLog);
}

export async function upsertHabitLog(
  supabase: Client,
  input: { habitId: string; logDate: string; completed: boolean; note?: string | null }
): Promise<HabitLog> {
  const { data, error } = await supabase
    .from("habit_logs")
    .upsert(
      { habit_id: input.habitId, log_date: input.logDate, completed: input.completed, note: input.note ?? null },
      { onConflict: "habit_id,log_date" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return mapHabitLog(data);
}

export async function upsertMetricLog(
  supabase: Client,
  input: { metricId: string; logDate: string; value: number }
): Promise<MetricLog> {
  const { data, error } = await supabase
    .from("metric_logs")
    .upsert(
      { metric_id: input.metricId, log_date: input.logDate, value: input.value },
      { onConflict: "metric_id,log_date" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return mapMetricLog(data);
}

export async function deleteMetricLog(supabase: Client, metricId: string, logDate: string): Promise<void> {
  const { error } = await supabase.from("metric_logs").delete().eq("metric_id", metricId).eq("log_date", logDate);
  if (error) throw error;
}
