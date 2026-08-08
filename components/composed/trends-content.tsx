"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHabits } from "@/hooks/useHabits";
import { useMetrics } from "@/hooks/useMetrics";
import { useHabitLogsInRange, useMetricLogsInRange } from "@/hooks/useDayLogs";
import { computeScoreSeries } from "@/lib/calculations/score";
import { rollingAverage } from "@/lib/calculations/averages";
import { computeTrend } from "@/lib/calculations/trend";
import { addDays, parseDateKey, toDateKey } from "@/lib/calculations/date-utils";

const PERIODS = [7, 30, 90] as const;
type Period = (typeof PERIODS)[number];

export function TrendsContent() {
  const [period, setPeriod] = useState<Period>(30);

  const today = toDateKey(new Date());
  const from = toDateKey(addDays(new Date(), -(period - 1)));

  const habitsQuery = useHabits();
  const metricsQuery = useMetrics();
  const habitLogsQuery = useHabitLogsInRange(from, today);
  const metricLogsQuery = useMetricLogsInRange(from, today);

  const isLoading =
    habitsQuery.isPending || metricsQuery.isPending || habitLogsQuery.isPending || metricLogsQuery.isPending;

  const { chartData, trend } = useMemo(() => {
    if (isLoading) return { chartData: [], trend: null };
    const series = computeScoreSeries({
      habits: habitsQuery.data ?? [],
      metrics: metricsQuery.data ?? [],
      habitLogs: habitLogsQuery.data ?? [],
      metricLogs: metricLogsQuery.data ?? [],
      from,
      to: today,
    });
    const avg = rollingAverage(
      series.map((p) => (p.hasData ? p.score : null)),
      7
    );
    return {
      chartData: series.map((p, i) => ({
        date: p.date,
        label: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(parseDateKey(p.date)),
        score: p.score,
        average: avg[i] === null ? undefined : Math.round(avg[i]!),
      })),
      trend: computeTrend(series.map((p) => p.score)),
    };
  }, [isLoading, habitsQuery.data, metricsQuery.data, habitLogsQuery.data, metricLogsQuery.data, from, today]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-xl font-semibold">Tendances</h1>
        <div className="flex gap-1 rounded-md border border-border p-1">
          {PERIODS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={p === period ? "default" : "ghost"}
              onClick={() => setPeriod(p)}
              className="h-7 px-3 text-xs"
            >
              {p}j
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-72 rounded-lg" />
      ) : (
        <>
          {trend && (
            <div
              className={cn(
                "flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm",
                trend.direction === "up" && "border-success/40 text-success",
                trend.direction === "down" && "border-destructive/40 text-destructive",
                trend.direction === "flat" && "border-border text-muted-foreground"
              )}
            >
              {trend.direction === "up" && <TrendingUp className="size-4" />}
              {trend.direction === "down" && <TrendingDown className="size-4" />}
              {trend.direction === "flat" && <Minus className="size-4" />}
              {trend.delta > 0 ? "+" : ""}
              {trend.delta}% sur la période
            </div>
          )}

          <div className="h-72 rounded-lg border border-border p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  interval={period > 30 ? Math.floor(period / 10) : "preserveStartEnd"}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2} fill="url(#scoreFill)" />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="var(--color-chart-cyan)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" /> Score du jour
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: "var(--color-chart-cyan)" }} /> Moyenne 7
              jours
            </span>
          </div>
        </>
      )}
    </div>
  );
}
