import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/react-query/get-query-client";
import { createClient } from "@/lib/supabase/server";
import { fetchHabits } from "@/lib/queries/habits";
import { fetchMetrics } from "@/lib/queries/metrics";
import { fetchHabitLogsInRange, fetchMetricLogsInRange } from "@/lib/queries/logs";
import { habitLogsKey, metricLogsKey } from "@/hooks/useDayLogs";
import { addDays, toDateKey } from "@/lib/calculations/date-utils";
import { TrendsContent } from "@/components/composed/trends-content";

const DEFAULT_PERIOD_DAYS = 30;

export default async function TrendsPage() {
  const supabase = await createClient();
  const queryClient = getQueryClient();

  const today = toDateKey(new Date());
  const from = toDateKey(addDays(new Date(), -(DEFAULT_PERIOD_DAYS - 1)));

  await Promise.all([
    queryClient.prefetchQuery({ queryKey: ["habits"], queryFn: () => fetchHabits(supabase) }),
    queryClient.prefetchQuery({ queryKey: ["metrics"], queryFn: () => fetchMetrics(supabase) }),
    queryClient.prefetchQuery({
      queryKey: habitLogsKey(from, today),
      queryFn: () => fetchHabitLogsInRange(supabase, from, today),
    }),
    queryClient.prefetchQuery({
      queryKey: metricLogsKey(from, today),
      queryFn: () => fetchMetricLogsInRange(supabase, from, today),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TrendsContent />
    </HydrationBoundary>
  );
}
