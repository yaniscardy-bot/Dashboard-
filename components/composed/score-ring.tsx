"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

interface ScoreRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ScoreRing({ score, size = 180, strokeWidth = 14, label }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useMotionValue(0);
  const dashoffset = useTransform(progress, (v) => circumference * (1 - v / 100));
  const displayed = useTransform(progress, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(progress, score, { type: "spring", stiffness: 90, damping: 18 });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const color = score >= 70 ? "var(--color-success)" : score >= 40 ? "var(--color-primary)" : "var(--color-destructive)";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashoffset }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span className="font-mono text-4xl font-semibold tabular-nums">{displayed}</motion.span>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
