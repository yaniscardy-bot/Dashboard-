import type { ExportBundle } from "./json";

function escapeCsvField(value: string | number | boolean): string {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toRow(fields: (string | number | boolean)[]): string {
  return fields.map(escapeCsvField).join(",");
}

/**
 * Format long : une ligne par entrée journalière (habitude ou métrique),
 * le format le plus portable pour ré-importer ou analyser ailleurs
 * (tableur, script) sans avoir à joindre plusieurs fichiers.
 */
export function toCSV(bundle: ExportBundle): string {
  const habitById = new Map(bundle.habits.map((h) => [h.id, h]));
  const metricById = new Map(bundle.metrics.map((m) => [m.id, m]));

  const lines = [toRow(["date", "type", "name", "value", "unit"])];

  for (const log of bundle.habitLogs) {
    const habit = habitById.get(log.habitId);
    lines.push(toRow([log.logDate, "habit", habit?.name ?? log.habitId, log.completed ? 1 : 0, ""]));
  }

  for (const log of bundle.metricLogs) {
    const metric = metricById.get(log.metricId);
    lines.push(toRow([log.logDate, "metric", metric?.name ?? log.metricId, log.value, metric?.unit ?? ""]));
  }

  return lines.join("\n");
}
