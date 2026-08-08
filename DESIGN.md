# Système de design

Références visées : Linear, Streaks (iOS), Arc Browser. Objectif : sobre,
confiant, dense en information sans être bruyant, animations qui donnent
l'impression que l'interface *répond* plutôt qu'elle *réagit*.

## Couleur

Tokens sémantiques en HSL, définis sur `:root` (clair) et `.dark` (sombre),
mappés en variables Tailwind v4 (`@theme inline`) dans `app/globals.css` :
`background, foreground, card, popover, primary, secondary, muted, accent,
destructive, success, warning, border, input, ring`.

- **Primary** : indigo/violet `hsl(243 75% 59%)` en clair, éclairci à
  `hsl(243 85% 71%)` en sombre pour garder le même contraste perçu sur fond
  sombre (une couleur saturée identique en HSL paraît plus terne sur fond
  noir — on remonte la lightness, pas juste on réutilise la valeur claire).
- **Neutrals** : teinte 240° (légèrement froide, bleu-gris) à faible
  saturation plutôt que du gris pur — cohérent avec le violet primaire.
- **Fond sombre** : `hsl(240 10% 6%)`, pas noir pur — un noir pur écrase le
  relief des cartes ; ce gris très sombre laisse les bordures/ombres lisibles.
- **Palette catégorielle** (8 teintes fixes, identiques en clair/sombre) :
  rose, orange, amber, lime, emerald, cyan, blue, violet — utilisée pour le
  code couleur des habitudes/métriques et comme palette de séries dans les
  graphes. Fixe (non swappée par thème) car ces couleurs doivent rester
  reconnaissables d'un mode à l'autre.

## Élévation

3 paliers d'ombre (`--shadow-xs/md/lg`) pour repos/survol/modale, teintées
neutre plutôt que noir pur. **En mode sombre, l'ombre porte à peine** sur un
fond déjà sombre — la convention adoptée dans les composants est donc :
*élévation par bordure en dark mode, par ombre en light mode*. Les tokens
d'ombre restent définis (popovers/modales en ont toujours besoin par-dessus
du contenu), mais les cartes de contenu s'appuient sur `border-border` en
sombre plutôt que sur `shadow-md`.

## Rayons

`sm` 6px (badges, contrôles), `md` 10px (inputs, boutons), `lg` 16px
(cartes), `full` (pills, avatars). Plus généreux que les défauts shadcn —
plus proche du rendu Streaks/Arc que d'un design system d'entreprise.

## Typographie

Deux familles, déjà câblées par `create-next-app` via `next/font/google` :
- **Geist Sans** — UI, titres, corps de texte.
- **Geist Mono** — réservée aux valeurs numériques (score, séries, valeurs
  de métriques) pour un alignement tabulaire qui signale "donnée précise"
  par opposition au texte courant.

Échelle : `text-xs/sm/base/lg/xl/2xl/3xl` — labels/corps/titres de
carte/titres de page/nombre de l'anneau de score, respectivement.

## Mouvement

Voir `lib/motion/tokens.ts` pour les presets Framer Motion (springs, durées,
stagger, variants de transition de page) — documentés là plutôt qu'ici car
ce sont des objets JS, pas des tokens CSS. Durées CSS simples (`--duration-
fast/base/slow` = 150/250/400ms) réservées aux transitions non gérées par
Framer (ex : fallback de bascule de thème).

## Composants

shadcn/ui n'a pas pu être installé via son CLI (le registre `ui.shadcn.com`
est bloqué par la politique réseau de cet environnement de build) : les
primitives sont donc vendorisées à la main dans `components/ui/`, en
suivant strictement les conventions shadcn (Radix UI + `class-variance-
authority` + `cn()`) — ce qui revient exactement au même résultat, puisque
le modèle shadcn est justement "le code vit dans votre repo", pas une
dépendance externe. `components.json` est conservé pour la cohérence/
documentation même si `npx shadcn add` ne fonctionnera pas dans cet
environnement de build (il fonctionnera normalement en local/CI avec accès
réseau standard).
