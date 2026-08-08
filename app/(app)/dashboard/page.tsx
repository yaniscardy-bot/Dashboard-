import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/react-query/get-query-client";
import { createClient } from "@/lib/supabase/server";
import { fetchHabits } from "@/lib/queries/habits";
import { fetchMetrics } from "@/lib/queries/metrics";
import { fetchHabitLogsInRange, fetchMetricLogsInRange } from "@/lib/queries/logs";
import { habitLogsKey, metricLogsKey } from "@/hooks/useDayLogs";
import { toDateKey } from "@/lib/calculations/date-utils";
import { DashboardContent } from "@/components/composed/dashboard-content";

export default async function DashboardPage() {
  const supabase = await createClient();
  const queryClient = getQueryClient();
  const today = toDateKey(new Date());

  await Promise.all([
    queryClient.prefetchQuery({ queryKey: ["habits"], queryFn: () => fetchHabits(supabase) }),
    queryClient.prefetchQuery({ queryKey: ["metrics"], queryFn: () => fetchMetrics(supabase) }),
    queryClient.prefetchQuery({
      queryKey: habitLogsKey(today, today),
      queryFn: () => fetchHabitLogsInRange(supabase, today, today),
    }),
    queryClient.prefetchQuery({
      queryKey: metricLogsKey(today, today),
      queryFn: () => fetchMetricLogsInRange(supabase, today, today),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContent />
    </HydrationBoundary>
  );
}
