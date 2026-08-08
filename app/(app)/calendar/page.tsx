import { CalendarDays } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-3 py-24 text-center">
      <CalendarDays className="size-10 text-muted-foreground" />
      <h1 className="font-sans text-lg font-semibold">Calendrier — à venir</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        La vue mensuelle avec heatmap de complétion arrive dans la prochaine itération (Phase 3 du plan). Le
        tableau de bord et l&apos;historique des habitudes/métriques sont déjà fonctionnels.
      </p>
    </div>
  );
}
