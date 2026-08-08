import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const {
  WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_VERIFY_TOKEN,
  WHATSAPP_APP_SECRET,
  ALLOWED_SENDERS,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  PORT
} = process.env;

for (const [name, val] of Object.entries({
  WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
})) {
  if (!val) console.warn(`[config] Variable d'environnement manquante : ${name} — le serveur démarre mais certaines routes échoueront.`);
}

const allowedSenders = (ALLOWED_SENDERS || '').split(',').map(s => s.trim()).filter(Boolean);
const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const app = express();

// Corps brut conservé pour la vérification de signature Meta, puis reparsé en JSON.
app.use('/webhook', express.raw({ type: 'application/json' }));

/* -------------------------------------------------------
   GET /webhook — vérification initiale exigée par Meta
   ------------------------------------------------------- */
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  console.warn('[webhook] Échec de vérification (token invalide).');
  return res.sendStatus(403);
});

/* -------------------------------------------------------
   POST /webhook — réception des messages
   ------------------------------------------------------- */
app.post('/webhook', async (req, res) => {
  // Répondre tout de suite : Meta réessaie si la réponse tarde ou échoue.
  res.sendStatus(200);

  if (WHATSAPP_APP_SECRET) {
    if (!verifySignature(req)) {
      console.error('[webhook] Signature invalide — requête rejetée.');
      return;
    }
  } else {
    console.warn('[webhook] WHATSAPP_APP_SECRET non configuré : la signature des requêtes entrantes n\'est pas vérifiée.');
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString('utf8'));
  } catch (err) {
    console.error('[webhook] Corps JSON invalide :', err.message);
    return;
  }

  try {
    const messages = extractMessages(payload);
    for (const msg of messages) {
      await handleIncomingMessage(msg);
    }
  } catch (err) {
    console.error('[webhook] Erreur de traitement :', err);
  }
});

function verifySignature(req) {
  const signature = req.get('X-Hub-Signature-256');
  if (!signature) return false;
  const expected = 'sha256=' + crypto
    .createHmac('sha256', WHATSAPP_APP_SECRET)
    .update(req.body)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function extractMessages(payload) {
  const out = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      for (const msg of change.value?.messages || []) {
        out.push(msg);
      }
    }
  }
  return out;
}

/* -------------------------------------------------------
   Traitement d'un message entrant
   ------------------------------------------------------- */
async function handleIncomingMessage(msg) {
  const from = msg.from; // numéro E.164 sans '+'
  const text = msg.text?.body?.trim();

  if (allowedSenders.length && !allowedSenders.includes(from)) {
    console.warn(`[webhook] Expéditeur non autorisé : ${from}`);
    await replyText(from, "⛔ Numéro non autorisé pour ce tableau de bord.");
    return;
  }

  if (!text) {
    await replyText(from, "Je ne comprends que le texte. Essayez : \"sommeil 7.5\" ou \"sport fait\".");
    return;
  }

  if (!supabase) {
    await replyText(from, "⚠️ Le serveur n'est pas relié à la base de données (config Supabase manquante). Message non enregistré.");
    return;
  }

  const parsed = parseCommand(text);
  if (!parsed) {
    await replyText(from, `Commande non reconnue : "${text}". Format attendu : "sommeil 7.5" (métrique) ou "sport fait" / "sport annule" (habitude).`);
    return;
  }

  try {
    if (parsed.type === 'metric') {
      const { error } = await supabase.from('metrics_log').insert({
        metric_key: parsed.key,
        value: parsed.value
      });
      if (error) throw error;
      await replyText(from, `✔ Métrique enregistrée : ${parsed.key} = ${parsed.value}`);
    } else {
      const { error } = await supabase.from('habits_log').insert({
        habit_key: parsed.key,
        done: parsed.done
      });
      if (error) throw error;
      await replyText(from, `✔ Habitude "${parsed.key}" marquée comme ${parsed.done ? 'faite' : 'non faite'}.`);
    }
  } catch (err) {
    console.error('[supabase] Échec écriture :', err);
    await replyText(from, `⚠️ Échec de l'enregistrement en base : ${err.message || err}`);
  }
}

/* -------------------------------------------------------
   Parsing des commandes texte
   Exemples : "sommeil 7.5" | "pas 9000" | "sport fait" | "sport annule"
   ------------------------------------------------------- */
function parseCommand(text) {
  const lower = text.toLowerCase().trim();
  const parts = lower.split(/\s+/);
  if (parts.length < 2) return null;

  const key = parts[0];
  const rest = parts.slice(1).join(' ');

  const num = Number(rest.replace(',', '.'));
  if (!Number.isNaN(num) && rest.match(/^[\d.,]+$/)) {
    return { type: 'metric', key, value: num };
  }

  if (['fait', 'ok', 'oui', 'done'].includes(rest)) {
    return { type: 'habit', key, done: true };
  }
  if (['annule', 'non', 'pas fait', 'undone'].includes(rest)) {
    return { type: 'habit', key, done: false };
  }

  return null;
}

/* -------------------------------------------------------
   Envoi d'une réponse WhatsApp
   ------------------------------------------------------- */
async function replyText(to, body) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error('[whatsapp] Impossible de répondre : token ou phone_number_id manquant.');
    return;
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        text: { body }
      })
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error('[whatsapp] Échec envoi réponse :', res.status, errBody);
    }
  } catch (err) {
    console.error('[whatsapp] Erreur réseau lors de la réponse :', err);
  }
}

app.get('/health', (_req, res) => res.json({
  ok: true,
  supabaseConfigured: !!supabase,
  whatsappConfigured: !!(WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID)
}));

const port = PORT || 3000;
app.listen(port, () => console.log(`[server] STATION WhatsApp bot en écoute sur le port ${port}`));
