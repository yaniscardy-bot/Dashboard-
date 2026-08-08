# STATION — Extension bot WhatsApp

## Pourquoi c'est un projet séparé

Le tableau de bord `index.html` / `style.css` / `app.js` à la racine du dépôt
persiste via `window.storage`, une API qui n'existe **que dans le navigateur
qui affiche la page**. Un message WhatsApp arrive sur un serveur Meta/Twilio,
pas dans votre navigateur : rien ne peut donc "pousser" une donnée dans
`window.storage` depuis l'extérieur. Il n'existe pas de solution plus simple
qui contournerait ce fait — un stockage accessible uniquement depuis l'onglet
ouvert ne peut pas recevoir de webhook.

Il faut un vrai backend avec une vraie base de données partagée, atteignable
à la fois par le webhook WhatsApp et par le site. C'est ce que ce dossier
met en place.

## Architecture

```
WhatsApp (utilisateur)
      │  "sommeil 7.5"
      ▼
Meta Cloud API (webhook)
      │  POST /webhook
      ▼
┌─────────────────────────────┐
│  server/ (Node.js/Express)  │
│  - vérifie la signature      │
│  - parse le message          │
│  - écrit dans Supabase       │
└─────────────────────────────┘
      │
      ▼
Supabase (Postgres managé, gratuit en petit volume)
   table metrics_log, habits_log
      ▲
      │  GET/POST via API REST (fetch)
      │
┌─────────────────────────────┐
│  site STATION (frontend)     │
│  lit/écrit via Supabase JS   │
│  au lieu de window.storage    │
└─────────────────────────────┘
```

### a) Réception des messages WhatsApp

**Choix retenu : API Cloud de Meta (WhatsApp Business Platform)**, directe,
gratuite jusqu'à un volume conversationnel confortable pour un usage
personnel, sans intermédiaire payant.

Alternative valable : **Twilio** (plus simple à activer en sandbox pour
tester en quelques minutes, mais payant au message dès la sortie du sandbox).
Le code du webhook ci-dessous est écrit pour l'API Meta ; l'adapter à Twilio
ne change que le parsing de la charge utile entrante (`req.body`), pas le
reste du pipeline.

Étapes côté Meta :
1. Créer une app sur [developers.facebook.com](https://developers.facebook.com),
   produit "WhatsApp".
2. Récupérer un numéro de test WhatsApp (gratuit) et un `access token`.
3. Configurer l'URL de webhook (`https://votre-serveur/webhook`) et un
   `VERIFY_TOKEN` arbitraire que vous choisissez.
4. Vérifier le webhook (Meta envoie une requête `GET` de challenge, gérée
   dans `server/index.js`).

### b) Serveur qui parse et écrit en base

Voir `server/index.js`. Il :
- répond au challenge de vérification Meta (`GET /webhook`),
- reçoit les messages entrants (`POST /webhook`),
- authentifie l'expéditeur par numéro de téléphone (whitelist dans `.env`,
  puisque c'est un dashboard personnel, pas un service multi-utilisateur),
- parse des commandes texte simples :
  - `sommeil 7.5` → écrit `metrics_log(metric="sommeil", value=7.5)`
  - `pas 9000` → écrit `metrics_log(metric="pas", value=9000)`
  - `sport fait` / `sport` → écrit `habits_log(habit="sport", done=true)`
  - `sport annule` → `habits_log(habit="sport", done=false)`
- répond sur WhatsApp avec une confirmation ("✔ Sommeil enregistré : 7.5h").

### c) Base de données partagée

**Choix retenu : Supabase** (Postgres managé, gratuit pour ce volume,
API REST générée automatiquement, SDK JS utilisable directement depuis le
site statique sans backend supplémentaire côté lecture).

Schéma dans `server/schema.sql` :
- `metrics_log(id, date, metric_key, value, created_at)`
- `habits_log(id, date, habit_key, done, created_at)`

Le site STATION actuel utilise des **identifiants générés localement**
(`habitsDefs[].id`, `metricsDefs[].id`) qui ne correspondent à rien côté
bot — le bot ne connaît que des clés texte stables (`sommeil`, `sport`...).
Il faut donc, côté frontend, faire correspondre `metric_key` texte ↔
définition de métrique (par exemple en ajoutant un champ `key` optionnel à
chaque `metricsDefs[]` / `habitsDefs[]` dans les Réglages du site, à
renseigner une fois : "sommeil", "sport", etc.). C'est un point d'intégration
réel à traiter, pas un détail : sans cette correspondance, le bot écrit des
données que le site ne saura pas relier à la bonne carte.

## Ce qui est livré ici vs. ce qui reste à faire

Livré et fonctionnel dans ce dossier :
- serveur Express complet (`server/index.js`) : vérification webhook,
  parsing des commandes, écriture Supabase, réponse WhatsApp,
  gestion d'erreurs explicite (jamais d'échec silencieux : toute erreur de
  parsing ou d'écriture renvoie un message WhatsApp d'erreur explicite au
  lieu de rien renvoyer).
- schéma SQL prêt à exécuter dans Supabase (`server/schema.sql`).
- `.env.example` avec toutes les variables nécessaires.

Reste à faire (nécessite vos propres identifiants et décisions, donc pas
automatisable depuis cette session) :
1. Créer le projet Supabase, exécuter `schema.sql`, récupérer l'URL + clé API.
2. Créer l'app Meta WhatsApp Business, obtenir le token et le numéro de test.
3. Déployer `server/` quelque part joignable publiquement (Render, Fly.io,
   Railway ont un plan gratuit suffisant ; un simple VPS fonctionne aussi).
4. Adapter le frontend STATION pour lire/écrire dans Supabase au lieu de
   `window.storage` — c'est un second chantier frontend à part entière
   (remplacer les appels `StorageBridge` par des appels `supabase-js`,
   gérer l'auth si le site devient public, gérer le mapping des clés
   décrit ci-dessus). Si vous voulez que je le fasse, il vaut mieux le
   traiter comme une nouvelle session dédiée à ce frontend-là, en partant
   de ce backend comme source de vérité.

## Démarrage local

```bash
cd server
cp .env.example .env   # renseigner les vraies valeurs
npm install
npm start
```

Pour tester sans exposer publiquement votre machine, utilisez un tunnel
(`ngrok http 3000` ou équivalent) et pointez l'URL de webhook Meta vers
l'URL du tunnel + `/webhook`.
