import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/react-query/get-query-client";
import { createClient } from "@/lib/supabase/server";
import { fetchHabits } from "@/lib/queries/habits";
import { fetchMetrics } from "@/lib/queries/metrics";
import { fetchHabitLogsInRange, fetchMetricLogsInRange } from "@/lib/queries/logs";
import { habitLogsKey, metricLogsKey } from "@/hooks/useDayLogs";
import { addDays, toDateKey } from "@/lib/calculations/date-utils";
import { HistoryContent } from "@/components/composed/history-content";

const RANGE_DAYS = 365;

export default async function HistoryPage() {
  const supabase = await createClient();
  const queryClient = getQueryClient();

  const today = toDateKey(new Date());
  const from = toDateKey(addDays(new Date(), -RANGE_DAYS));

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
      <HistoryContent />
    </HydrationBoundary>
  );
}
