"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { listContainerVariants, listItemVariants } from "@/lib/motion/tokens";
import type { DayScorePoint } from "@/lib/calculations/score";

const WEEKDAY_LABELS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexé
  scoreByDate: Map<string, DayScorePoint>;
  todayKey: string;
  onSelectDay: (date: string) => void;
}

function heatClass(point: DayScorePoint | undefined): string {
  if (!point || !point.hasData) return "bg-muted";
  if (point.score >= 95) return "bg-primary";
  if (point.score >= 75) return "bg-primary/70";
  if (point.score >= 45) return "bg-primary/45";
  if (point.score >= 15) return "bg-primary/25";
  return "bg-destructive/30";
}

export function CalendarGrid({ year, month, scoreByDate, todayKey, onSelectDay }: CalendarGridProps) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <motion.div variants={listContainerVariants} initial="initial" animate="animate" className="grid grid-cols-7 gap-2">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const point = scoreByDate.get(date);
          const isToday = date === todayKey;

          return (
            <motion.button
              key={date}
              variants={listItemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectDay(date)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-md border text-xs transition-colors",
                isToday ? "border-primary" : "border-transparent",
                "hover:border-muted-foreground/30"
              )}
            >
              <span className="text-muted-foreground">{day}</span>
              <span className={cn("size-2.5 rounded-sm", heatClass(point))} />
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
