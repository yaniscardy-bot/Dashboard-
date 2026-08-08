# STATION — Tableau de bord personnel

Tableau de bord personnel façon cockpit/HUD : score du jour, habitudes,
métriques, tâches, objectifs long terme, calendrier et historique.

## Utilisation

Ouvrez `index.html` dans un navigateur. Toute la persistance passe par
`window.storage` (jamais `localStorage`) : c'est l'environnement d'exécution
qui doit fournir cette API (`get`/`set` ou `getItem`/`setItem`, sync ou
asynchrone). Si `window.storage` est absent, l'application le signale
visiblement (LED de statut rouge + notification) et continue de fonctionner
en mémoire pour la session, sans échec silencieux.

Fichiers :
- `index.html` — structure, 4 onglets (Tableau de bord / Calendrier /
  Historique / Réglages)
- `style.css` — identité visuelle (fond quasi-noir, ambre/cyan, cockpit HUD)
- `app.js` — logique, état, rendu, calcul du score, persistance

## Extension bot WhatsApp

Voir [`whatsapp-bot/README.md`](./whatsapp-bot/README.md) : mise à jour des
métriques/habitudes à distance par message WhatsApp. Nécessite un vrai
backend (Node.js + Supabase), traité comme un projet séparé puisque
`window.storage` n'est accessible que depuis l'onglet ouvert du site.
