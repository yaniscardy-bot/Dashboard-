"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarGrid } from "@/components/composed/calendar-grid";
import { useHabits } from "@/hooks/useHabits";
import { useMetrics } from "@/hooks/useMetrics";
import { useHabitLogsInRange, useMetricLogsInRange } from "@/hooks/useDayLogs";
import { useUIStore } from "@/stores/ui-store";
import { computeScoreSeries } from "@/lib/calculations/score";
import { toDateKey } from "@/lib/calculations/date-utils";

export function CalendarContent() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexé

  const router = useRouter();
  const setSelectedDate = useUIStore((s) => s.setSelectedDate);

  const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const to = toDateKey(new Date(year, month + 1, 0));

  const habitsQuery = useHabits();
  const metricsQuery = useMetrics();
  const habitLogsQuery = useHabitLogsInRange(from, to);
  const metricLogsQuery = useMetricLogsInRange(from, to);

  const isLoading =
    habitsQuery.isPending || metricsQuery.isPending || habitLogsQuery.isPending || metricLogsQuery.isPending;

  const scoreByDate = useMemo(() => {
    if (isLoading) return new Map();
    const series = computeScoreSeries({
      habits: habitsQuery.data ?? [],
      metrics: metricsQuery.data ?? [],
      habitLogs: habitLogsQuery.data ?? [],
      metricLogs: metricLogsQuery.data ?? [],
      from,
      to,
    });
    return new Map(series.map((p) => [p.date, p]));
  }, [isLoading, habitsQuery.data, metricsQuery.data, habitLogsQuery.data, metricLogsQuery.data, from, to]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  function selectDay(date: string) {
    setSelectedDate(date);
    router.push("/dashboard");
  }

  const title = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(year, month, 1));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)} aria-label="Mois précédent">
          <ChevronLeft className="size-4" />
        </Button>
        <h1 className="w-40 text-center font-sans text-lg font-semibold capitalize">{title}</h1>
        <Button variant="outline" size="icon" onClick={() => shiftMonth(1)} aria-label="Mois suivant">
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-80 rounded-lg" />
      ) : (
        <CalendarGrid
          year={year}
          month={month}
          scoreByDate={scoreByDate}
          todayKey={toDateKey(today)}
          onSelectDay={selectDay}
        />
      )}

      <p className="text-center text-xs text-muted-foreground">
        Cliquez un jour pour l&apos;ouvrir dans le tableau de bord et le modifier.
      </p>
    </div>
  );
}
