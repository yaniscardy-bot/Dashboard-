/** Utilitaires de date locale, indépendants du fuseau du serveur/navigateur. */

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

/** Lundi = 0 .. Dimanche = 6 (ISO), pour regrouper les dates par semaine. */
export function isoWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** Clé stable identifiant la semaine ISO d'une date (lundi de cette semaine, en YYYY-MM-DD). */
export function isoWeekKey(date: Date): string {
  const monday = addDays(date, -isoWeekday(date));
  return toDateKey(monday);
}

export function isSameDate(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

/** Génère les dates (ascendant) de `from` à `to` inclus, aux deux bornes tronquées à minuit local. */
export function eachDate(from: Date, to: Date): Date[] {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  const dates: Date[] = [];
  for (let d = start; d.getTime() <= end.getTime(); d = addDays(d, 1)) {
    dates.push(d);
  }
  return dates;
}
