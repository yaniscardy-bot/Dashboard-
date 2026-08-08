export type FrequencyType = "daily" | "weekly_count" | "specific_weekdays";

export interface Habit {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  color: string | null;
  frequencyType: FrequencyType;
  /** utilisé par weekly_count : nombre de fois par semaine ISO */
  frequencyTarget: number | null;
  /** utilisé par specific_weekdays : 0=dimanche .. 6=samedi */
  frequencyWeekdays: number[] | null;
  archived: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  /** format 'YYYY-MM-DD', toujours en heure locale */
  logDate: string;
  completed: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TargetDirection = "at_least" | "at_most" | "exact";

export interface Metric {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  unit: string;
  targetValue: number | null;
  targetDirection: TargetDirection | null;
  decimals: number;
  color: string | null;
  archived: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface MetricLog {
  id: string;
  metricId: string;
  userId: string;
  logDate: string;
  value: number;
  createdAt: string;
  updatedAt: string;
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  /** la fenêtre de grâce la plus récente (se terminant au jour dû le plus récent) a-t-elle absorbé un manquement ? */
  graceUsedThisWindow: boolean;
  /** le jour de référence (asOf) est un jour dû et n'est pas encore complété */
  isAtRisk: boolean;
}

export interface DayScoreResult {
  done: number;
  total: number;
  /** 0-100, arrondi ; 0 si aucun objectif défini */
  score: number;
}
