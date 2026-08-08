import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

/** Un QueryClient par requête serveur, pour le prefetch + hydratation (recette officielle TanStack Query / Next.js App Router). */
export const getQueryClient = cache(() => new QueryClient());
