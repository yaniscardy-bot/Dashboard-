import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/react-query/get-query-client";
import { createClient } from "@/lib/supabase/server";
import { fetchHabits } from "@/lib/queries/habits";
import { fetchMetrics } from "@/lib/queries/metrics";
import { fetchHabitLogsInRange, fetchMetricLogsInRange } from "@/lib/queries/logs";
import { habitLogsKey, metricLogsKey } from "@/hooks/useDayLogs";
import { toDateKey } from "@/lib/calculations/date-utils";
import { CalendarContent } from "@/components/composed/calendar-content";

export default async function CalendarPage() {
  const supabase = await createClient();
  const queryClient = getQueryClient();

  const today = new Date();
  const from = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const to = toDateKey(new Date(today.getFullYear(), today.getMonth() + 1, 0));

  await Promise.all([
    queryClient.prefetchQuery({ queryKey: ["habits"], queryFn: () => fetchHabits(supabase) }),
    queryClient.prefetchQuery({ queryKey: ["metrics"], queryFn: () => fetchMetrics(supabase) }),
    queryClient.prefetchQuery({
      queryKey: habitLogsKey(from, to),
      queryFn: () => fetchHabitLogsInRange(supabase, from, to),
    }),
    queryClient.prefetchQuery({
      queryKey: metricLogsKey(from, to),
      queryFn: () => fetchMetricLogsInRange(supabase, from, to),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CalendarContent />
    </HydrationBoundary>
  );
}
