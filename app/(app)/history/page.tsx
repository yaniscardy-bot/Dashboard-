import { History } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-3 py-24 text-center">
      <History className="size-10 text-muted-foreground" />
      <h1 className="font-sans text-lg font-semibold">Historique — à venir</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        La liste éditable de tous les jours passés arrive dans la prochaine itération. En attendant, utilisez les
        flèches ← → du tableau de bord pour consulter/modifier n&apos;importe quel jour, et l&apos;export dans
        Réglages pour récupérer tout l&apos;historique brut.
      </p>
    </div>
  );
}
