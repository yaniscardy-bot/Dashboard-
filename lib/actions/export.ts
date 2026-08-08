"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchHabits } from "@/lib/queries/habits";
import { fetchMetrics } from "@/lib/queries/metrics";
import { fetchHabitLogsInRange, fetchMetricLogsInRange } from "@/lib/queries/logs";
import type { ExportBundle } from "@/lib/export/json";

/** Récupère toutes les données de l'utilisateur courant (RLS scope déjà à auth.uid()). */
export async function getExportBundle(): Promise<ExportBundle> {
  const supabase = await createClient();

  const [habits, metrics, habitLogs, metricLogs] = await Promise.all([
    fetchHabits(supabase),
    fetchMetrics(supabase),
    fetchHabitLogsInRange(supabase, "0001-01-01", "9999-12-31"),
    fetchMetricLogsInRange(supabase, "0001-01-01", "9999-12-31"),
  ]);

  return { exportedAt: new Date().toISOString(), habits, metrics, habitLogs, metricLogs };
}
