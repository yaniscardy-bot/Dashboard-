import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButtons } from "@/components/composed/export-buttons";
import { LogoutButton } from "@/components/layout/logout-button";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-sans text-xl font-semibold">Réglages</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compte</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Données</CardTitle>
          <CardDescription>Exportez toutes vos habitudes, métriques et historiques.</CardDescription>
        </CardHeader>
        <CardContent>
          <ExportButtons />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Raccourcis clavier</CardTitle>
          <CardDescription>Disponibles sur le tableau de bord.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>← / → — jour précédent / suivant</p>
          <p className="text-xs italic">
            Palette de commandes (⌘K) et raccourcis étendus prévus dans une prochaine itération.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
