# Habit Tracker

Application de suivi d'habitudes et de métriques personnelles. Next.js
(App Router) + TypeScript strict, Tailwind CSS v4, composants shadcn/ui
vendorisés, Framer Motion, Supabase (auth + base de données), TanStack
Query, Zustand.

Voir [`DESIGN.md`](./DESIGN.md) pour le système de design (tokens couleur,
typographie, mouvement) et son raisonnement.

## Démarrage

```bash
npm install
cp .env.example .env.local   # voir supabase/README.md pour créer le projet et récupérer les clés
npm run dev
```

Sans configuration Supabase, l'app démarre mais l'authentification et
toutes les lectures/écritures échoueront avec une erreur visible (jamais
d'échec silencieux) — configurez d'abord `supabase/` (schéma + policies +
variables d'environnement) en suivant `supabase/README.md`.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run lint` | ESLint |
| `npm test` | Tests unitaires (Vitest) — logique de calcul (streaks, score, moyennes, tendance, export) |
| `npm run test:watch` | Tests en mode watch |

## État du projet

Fonctionnel de bout en bout : authentification par lien magique, CRUD
habitudes/métriques, tableau de bord du jour avec anneau de score,
navigation par jour (clavier ← →), mutations optimistes, export JSON/CSV,
thème clair/sombre animé.

Pas encore construit (voir le plan d'architecture pour le détail des
phases suivantes) : vue calendrier avec heatmap, liste d'historique
virtualisée, graphes de tendance Recharts, palette de commandes ⌘K. Les
routes correspondantes existent déjà (`/calendar`, `/history`, `/trends`)
avec un état "à venir" plutôt qu'une 404, et la logique de calcul
(moyennes glissantes, tendance) est déjà écrite et testée dans
`lib/calculations/` — il ne reste que l'UI à brancher dessus.

## Structure

```
app/(app)/*         routes protégées (dashboard, calendrier, historique, tendances, habitudes, métriques, réglages)
app/login, app/auth  authentification
components/ui/*      primitives vendorisées façon shadcn/ui
components/composed/* composants métier (ScoreRing, HabitCard, MetricCard, ...)
lib/calculations/*   logique pure testée (streaks avec grâce, score, moyennes, tendance)
lib/queries/*         accès Supabase typés
lib/supabase/*        clients + middleware/proxy d'auth
hooks/*                React Query + mutations optimistes
stores/ui-store.ts     état UI (Zustand)
supabase/*              schema.sql, policies.sql, README de setup
```
