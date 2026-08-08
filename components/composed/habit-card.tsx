"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";
import type { Habit } from "@/types/domain";

interface HabitCardProps {
  habit: Habit;
  completed: boolean;
  onToggle: () => void;
}

export function HabitCard({ habit, completed, onToggle }: HabitCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors duration-150",
        completed
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card hover:border-muted-foreground/30"
      )}
    >
      <motion.span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
          completed ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
        )}
        animate={completed ? { scale: [1, 1.15, 1] } : { scale: 1 }}
        transition={spring.bouncy}
      >
        {completed && (
          <motion.svg
            viewBox="0 0 24 24"
            className="size-3.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <motion.path
              d="M5 13l4 4L19 7"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}
      </motion.span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {habit.icon && <span className="mr-1.5">{habit.icon}</span>}
          {habit.name}
        </p>
      </div>
      {completed && <Check className="size-4 shrink-0 text-primary" />}
    </motion.button>
  );
}
