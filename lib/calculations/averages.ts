/** Moyenne d'une liste en ignorant les `null` (jours sans donnée) ; `null` si tout est vide. */
export function average(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return null;
  return present.reduce((a, b) => a + b, 0) / present.length;
}

/**
 * Moyenne glissante sur `windowSize` points. Les entrées `null` (jour sans
 * donnée) sont des trous : elles ne sont pas comptées comme 0 et ne
 * réduisent pas artificiellement la moyenne. Une fenêtre entièrement vide
 * produit `null`.
 */
export function rollingAverage(values: (number | null)[], windowSize: number): (number | null)[] {
  if (windowSize <= 0) throw new Error("windowSize doit être positif");
  return values.map((_, i) => {
    const start = Math.max(0, i - windowSize + 1);
    return average(values.slice(start, i + 1));
  });
}
