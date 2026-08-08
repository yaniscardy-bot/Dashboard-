"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { ListChecks, Gauge } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useHabits } from "@/hooks/useHabits";
import { useMetrics } from "@/hooks/useMetrics";
import { useHabitLogsForDay, useMetricLogsForDay } from "@/hooks/useDayLogs";
import { useToggleHabitLog } from "@/hooks/useToggleHabitLog";
import { useUpsertMetricLog } from "@/hooks/useUpsertMetricLog";
import { computeDayScore } from "@/lib/calculations/score";
import { listContainerVariants, listItemVariants } from "@/lib/motion/tokens";
import { DayNav } from "@/components/composed/day-nav";
import { ScoreRing } from "@/components/composed/score-ring";
import { HabitCard } from "@/components/composed/habit-card";
import { MetricCard } from "@/components/composed/metric-card";
import { EmptyState } from "@/components/composed/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardContent() {
  const selectedDate = useUIStore((s) => s.selectedDate);
  const shiftSelectedDate = useUIStore((s) => s.shiftSelectedDate);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.key === "ArrowLeft") shiftSelectedDate(-1);
      if (e.key === "ArrowRight") shiftSelectedDate(1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shiftSelectedDate]);

  const habitsQuery = useHabits();
  const metricsQuery = useMetrics();
  const habitLogsQuery = useHabitLogsForDay(selectedDate);
  const metricLogsQuery = useMetricLogsForDay(selectedDate);

  const toggleHabitLog = useToggleHabitLog();
  const upsertMetricLog = useUpsertMetricLog();

  const habits = (habitsQuery.data ?? []).filter((h) => !h.archived);
  const metrics = (metricsQuery.data ?? []).filter((m) => !m.archived);
  const habitLogs = habitLogsQuery.data ?? [];
  const metricLogs = metricLogsQuery.data ?? [];

  const { score } = computeDayScore({
    habits,
    habitLogsForDay: habitLogs,
    metrics,
    metricLogsForDay: metricLogs,
  });

  const isLoading = habitsQuery.isPending || metricsQuery.isPending;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <DayNav />

      <div className="flex justify-center py-2">
        <ScoreRing score={score} label="score du jour" />
      </div>

      <section className="space-y-3">
        <h2 className="font-sans text-sm font-semibold text-muted-foreground">Habitudes</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : habits.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Aucune habitude"
            description="Ajoutez votre première habitude pour commencer à suivre vos journées."
          />
        ) : (
          <motion.div
            variants={listContainerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {habits.map((habit) => {
              const completed = habitLogs.find((l) => l.habitId === habit.id)?.completed ?? false;
              return (
                <motion.div key={habit.id} variants={listItemVariants}>
                  <HabitCard
                    habit={habit}
                    completed={completed}
                    onToggle={() =>
                      toggleHabitLog.mutate({ habitId: habit.id, logDate: selectedDate, completed: !completed })
                    }
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-sans text-sm font-semibold text-muted-foreground">Métriques</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : metrics.length === 0 ? (
          <EmptyState
            icon={Gauge}
            title="Aucune métrique"
            description="Ajoutez une métrique (sommeil, pas, etc.) avec une cible pour la suivre au quotidien."
          />
        ) : (
          <motion.div
            variants={listContainerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {metrics.map((metric) => {
              const value = metricLogs.find((l) => l.metricId === metric.id)?.value ?? null;
              return (
                <motion.div key={metric.id} variants={listItemVariants}>
                  <MetricCard
                    metric={metric}
                    value={value}
                    onCommit={(v) => upsertMetricLog.mutate({ metricId: metric.id, logDate: selectedDate, value: v })}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>
    </div>
  );
}
