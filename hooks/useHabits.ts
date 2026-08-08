import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchHabits } from "@/lib/queries/habits";

export function useHabits() {
  return useQuery({
    queryKey: ["habits"],
    queryFn: () => fetchHabits(createClient()),
  });
}
