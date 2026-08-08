import { TrendingUp } from "lucide-react";

export default function TrendsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-3 py-24 text-center">
      <TrendingUp className="size-10 text-muted-foreground" />
      <h1 className="font-sans text-lg font-semibold">Tendances — à venir</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Les courbes 7/30/90 jours par habitude et métrique arrivent dans la prochaine itération. La logique de
        moyenne glissante et de tendance (<code className="font-mono text-xs">lib/calculations</code>) est déjà
        écrite et testée — il ne reste que le graphe Recharts à brancher dessus.
      </p>
    </div>
  );
}
