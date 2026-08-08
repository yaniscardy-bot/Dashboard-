import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Metric, TargetDirection } from "@/types/domain";

type Client = SupabaseClient<Database>;
type MetricRow = Database["public"]["Tables"]["metrics"]["Row"];

function mapMetric(row: MetricRow): Metric {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    icon: row.icon,
    unit: row.unit,
    targetValue: row.target_value,
    targetDirection: row.target_direction,
    decimals: row.decimals,
    color: row.color,
    archived: row.archived,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export async function fetchMetrics(supabase: Client): Promise<Metric[]> {
  const { data, error } = await supabase.from("metrics").select("*").order("sort_order");
  if (error) throw error;
  return data.map(mapMetric);
}

export interface MetricInput {
  name: string;
  icon?: string | null;
  unit: string;
  targetValue?: number | null;
  targetDirection?: TargetDirection | null;
  decimals?: number;
  color?: string | null;
}

export async function createMetric(supabase: Client, input: MetricInput): Promise<Metric> {
  const { data, error } = await supabase
    .from("metrics")
    .insert({
      name: input.name,
      icon: input.icon ?? null,
      unit: input.unit,
      target_value: input.targetValue ?? null,
      target_direction: input.targetDirection ?? null,
      decimals: input.decimals ?? 0,
      color: input.color ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapMetric(data);
}

export async function updateMetric(supabase: Client, id: string, input: Partial<MetricInput>): Promise<Metric> {
  const { data, error } = await supabase
    .from("metrics")
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.unit !== undefined && { unit: input.unit }),
      ...(input.targetValue !== undefined && { target_value: input.targetValue }),
      ...(input.targetDirection !== undefined && { target_direction: input.targetDirection }),
      ...(input.decimals !== undefined && { decimals: input.decimals }),
      ...(input.color !== undefined && { color: input.color }),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapMetric(data);
}

export async function setMetricArchived(supabase: Client, id: string, archived: boolean): Promise<void> {
  const { error } = await supabase.from("metrics").update({ archived }).eq("id", id);
  if (error) throw error;
}

export async function deleteMetric(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("metrics").delete().eq("id", id);
  if (error) throw error;
}
