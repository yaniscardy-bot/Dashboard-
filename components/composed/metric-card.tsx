"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { Metric } from "@/types/domain";

interface MetricCardProps {
  metric: Metric;
  value: number | null;
  onCommit: (value: number) => void;
}

function reached(metric: Metric, value: number | null): boolean {
  if (value === null || metric.targetValue === null || metric.targetDirection === null) return false;
  if (metric.targetDirection === "at_least") return value >= metric.targetValue;
  if (metric.targetDirection === "at_most") return value <= metric.targetValue;
  const factor = 10 ** metric.decimals;
  return Math.round(value * factor) === Math.round(metric.targetValue * factor);
}

export function MetricCard({ metric, value, onCommit }: MetricCardProps) {
  const [draft, setDraft] = useState(value !== null ? String(value) : "");
  const isReached = reached(metric, value);

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress =
    value === null || metric.targetValue === null || metric.targetValue === 0
      ? 0
      : metric.targetDirection === "at_most"
        ? value <= metric.targetValue
          ? 1
          : Math.max(0, Math.min(1, metric.targetValue / value))
        : Math.max(0, Math.min(1, value / metric.targetValue));

  function commit() {
    const num = Number(draft.replace(",", "."));
    if (draft === "" || Number.isNaN(num)) return;
    onCommit(num);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-4 transition-colors duration-150",
        isReached ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      )}
    >
      <svg width={48} height={48} className="-rotate-90 shrink-0">
        <circle cx={24} cy={24} r={radius} fill="none" stroke="var(--color-muted)" strokeWidth={5} />
        <motion.circle
          cx={24}
          cy={24}
          r={radius}
          fill="none"
          stroke={isReached ? "var(--color-success)" : "var(--color-primary)"}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {metric.icon && <span className="mr-1.5">{metric.icon}</span>}
          {metric.name}
        </p>
        {metric.targetValue !== null && (
          <p className="text-xs text-muted-foreground">
            Cible {metric.targetDirection === "at_most" ? "≤" : metric.targetDirection === "exact" ? "=" : "≥"}{" "}
            {metric.targetValue}
            {metric.unit}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          inputMode="decimal"
          step="any"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
          placeholder="—"
          className="h-9 w-20 text-right"
        />
        <span className="text-xs text-muted-foreground">{metric.unit}</span>
      </div>
    </div>
  );
}
