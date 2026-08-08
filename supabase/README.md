# Configuration Supabase

Le projet Supabase n'existe pas encore — ce dossier fournit tout ce qu'il
faut pour le créer.

## 1. Créer le projet

1. [supabase.com](https://supabase.com) → New Project.
2. Notez le mot de passe de base de données généré (utile pour un accès
   direct Postgres plus tard, pas requis pour l'app).

## 2. Appliquer le schéma

Dans l'éditeur SQL du projet (SQL Editor → New query), exécutez dans l'ordre :

1. le contenu de `schema.sql`
2. le contenu de `policies.sql`

## 3. Activer l'authentification par lien magique

Authentication → Providers → Email : laissez "Email" activé, "Confirm
email" peut rester activé. Aucune configuration SMTP n'est requise pour
tester (Supabase envoie via son propre service en développement, avec des
limites de débit — passez sur un provider SMTP dédié avant un vrai
lancement public).

Authentication → URL Configuration : renseignez `Site URL` (ex :
`http://localhost:3000` en dev, votre domaine Vercel en prod) et ajoutez-le
aux `Redirect URLs` avec le suffixe `/auth/callback`.

## 4. Récupérer les clés

Project Settings → API :
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` — **jamais** exposée
  côté client, utilisée uniquement par la Server Action de suppression de
  compte. Ne la collez jamais dans une variable préfixée `NEXT_PUBLIC_`.

## 5. Variables d'environnement

Copiez `.env.example` (racine du projet) vers `.env.local` et renseignez
les trois valeurs ci-dessus.

## 6. Générer les types TypeScript (optionnel mais recommandé)

```bash
npx supabase gen types typescript --project-id <votre-project-id> > types/database.types.ts
```
