/**
 * Traduit une erreur Supabase/PostgREST en message utilisateur.
 * Point de passage unique pour que toute erreur reste visible (jamais
 * d'échec silencieux) et compréhensible sans jargon Postgres.
 */
export function mapSupabaseError(error: unknown): string {
  if (!error) return "Une erreur inconnue est survenue.";

  const code = (error as { code?: string }).code;
  const message = (error as { message?: string }).message;

  if (code === "23505") return "Cette entrée existe déjà pour ce jour.";
  if (code === "42501") return "Vous n'avez pas accès à cette donnée.";
  if (code === "PGRST301") return "Session expirée, reconnectez-vous.";

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "Vous êtes hors ligne — la modification sera perdue si vous ne revenez pas en ligne.";
  }

  if (message?.toLowerCase().includes("fetch")) {
    return "Impossible de contacter le serveur. Vérifiez votre connexion.";
  }

  return message || "Une erreur inattendue est survenue.";
}
