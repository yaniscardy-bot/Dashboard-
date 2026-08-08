"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { History, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composed/empty-state";
import { useHabits } from "@/hooks/useHabits";
import { useMetrics } from "@/hooks/useMetrics";
import { useHabitLogsInRange, useMetricLogsInRange } from "@/hooks/useDayLogs";
import { useUIStore } from "@/stores/ui-store";
import { computeScoreSeries } from "@/lib/calculations/score";
import { addDays, parseDateKey, toDateKey } from "@/lib/calculations/date-utils";

const RANGE_DAYS = 365;

function formatLabel(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    .format(parseDateKey(date));
}

export function HistoryContent() {
  const today = toDateKey(new Date());
  const from = toDateKey(addDays(new Date(), -RANGE_DAYS));

  const router = useRouter();
  const setSelectedDate = useUIStore((s) => s.setSelectedDate);
  const [search, setSearch] = useState("");

  const habitsQuery = useHabits();
  const metricsQuery = useMetrics();
  const habitLogsQuery = useHabitLogsInRange(from, today);
  const metricLogsQuery = useMetricLogsInRange(from, today);

  const isLoading =
    habitsQuery.isPending || metricsQuery.isPending || habitLogsQuery.isPending || metricLogsQuery.isPending;

  const rows = useMemo(() => {
    if (isLoading) return [];
    const series = computeScoreSeries({
      habits: habitsQuery.data ?? [],
      metrics: metricsQuery.data ?? [],
      habitLogs: habitLogsQuery.data ?? [],
      metricLogs: metricLogsQuery.data ?? [],
      from,
      to: today,
    });
    return series
      .filter((p) => p.hasData || p.date === today)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [isLoading, habitsQuery.data, metricsQuery.data, habitLogsQuery.data, metricLogsQuery.data, from, today]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.date.includes(q) || formatLabel(r.date).toLowerCase().includes(q));
  }, [rows, search]);

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 8,
  });

  function openDay(date: string) {
    setSelectedDate(date);
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="font-sans text-xl font-semibold">Historique</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une date…"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={History} title="Aucun résultat" description="Aucun jour ne correspond à cette recherche." />
      ) : (
        <div ref={parentRef} className="h-[60vh] overflow-y-auto rounded-lg border border-border">
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((row) => {
              const point = filtered[row.index];
              return (
                <button
                  key={point.date}
                  onClick={() => openDay(point.date)}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: row.size, transform: `translateY(${row.start}px)` }}
                  className="flex items-center gap-3 border-b border-border px-4 text-left transition-colors hover:bg-accent"
                >
                  <span className="flex-1 truncate text-sm capitalize">{formatLabel(point.date)}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${point.score}%` }} />
                    </div>
                    <span className="w-10 text-right text-xs font-mono tabular-nums text-muted-foreground">
                      {point.score}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
