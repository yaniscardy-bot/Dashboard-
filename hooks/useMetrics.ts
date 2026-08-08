import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchMetrics } from "@/lib/queries/metrics";

export function useMetrics() {
  return useQuery({
    queryKey: ["metrics"],
    queryFn: () => fetchMetrics(createClient()),
  });
}
