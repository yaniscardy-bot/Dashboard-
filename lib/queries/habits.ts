import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Habit, FrequencyType } from "@/types/domain";

type Client = SupabaseClient<Database>;
type HabitRow = Database["public"]["Tables"]["habits"]["Row"];

function mapHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    frequencyType: row.frequency_type,
    frequencyTarget: row.frequency_target,
    frequencyWeekdays: row.frequency_weekdays,
    archived: row.archived,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export async function fetchHabits(supabase: Client): Promise<Habit[]> {
  const { data, error } = await supabase.from("habits").select("*").order("sort_order");
  if (error) throw error;
  return data.map(mapHabit);
}

export interface HabitInput {
  name: string;
  icon?: string | null;
  color?: string | null;
  frequencyType: FrequencyType;
  frequencyTarget?: number | null;
  frequencyWeekdays?: number[] | null;
}

export async function createHabit(supabase: Client, input: HabitInput): Promise<Habit> {
  const { data, error } = await supabase
    .from("habits")
    .insert({
      name: input.name,
      icon: input.icon ?? null,
      color: input.color ?? null,
      frequency_type: input.frequencyType,
      frequency_target: input.frequencyTarget ?? null,
      frequency_weekdays: input.frequencyWeekdays ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapHabit(data);
}

export async function updateHabit(supabase: Client, id: string, input: Partial<HabitInput>): Promise<Habit> {
  const { data, error } = await supabase
    .from("habits")
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.icon !== undefined && { icon: input.icon }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.frequencyType !== undefined && { frequency_type: input.frequencyType }),
      ...(input.frequencyTarget !== undefined && { frequency_target: input.frequencyTarget }),
      ...(input.frequencyWeekdays !== undefined && { frequency_weekdays: input.frequencyWeekdays }),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapHabit(data);
}

export async function setHabitArchived(supabase: Client, id: string, archived: boolean): Promise<void> {
  const { error } = await supabase.from("habits").update({ archived }).eq("id", id);
  if (error) throw error;
}

export async function deleteHabit(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("habits").delete().eq("id", id);
  if (error) throw error;
}
