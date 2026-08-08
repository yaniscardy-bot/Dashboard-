import { average } from "./averages";

export interface TrendResult {
  /** points de pourcentage, arrondi, positif = amélioration */
  delta: number;
  direction: "up" | "down" | "flat";
  currentAverage: number;
  previousAverage: number;
}

const FLAT_THRESHOLD = 1;

/**
 * Compare la moyenne de la moitié la plus récente d'une série de scores à
 * la moitié précédente. Avec un nombre impair de points, le point le plus
 * ancien est ignoré (on privilégie la donnée récente). Moins de 2 points
 * ne permet pas de comparaison : tendance neutre.
 */
export function computeTrend(scores: number[]): TrendResult {
  if (scores.length < 2) {
    const only = average(scores) ?? 0;
    return { delta: 0, direction: "flat", currentAverage: only, previousAverage: only };
  }

  const half = Math.floor(scores.length / 2);
  const recent = scores.slice(scores.length - half);
  const previous = scores.slice(scores.length - 2 * half, scores.length - half);

  const currentAverage = average(recent) ?? 0;
  const previousAverage = average(previous) ?? currentAverage;
  const delta = Math.round(currentAverage - previousAverage);

  const direction: TrendResult["direction"] =
    delta > FLAT_THRESHOLD ? "up" : delta < -FLAT_THRESHOLD ? "down" : "flat";

  return { delta, direction, currentAverage, previousAverage };
}
