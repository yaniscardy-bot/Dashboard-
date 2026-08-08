-- STATION — schéma Supabase pour l'extension WhatsApp
-- À exécuter dans l'éditeur SQL de votre projet Supabase.

create table if not exists metrics_log (
  id          uuid primary key default gen_random_uuid(),
  log_date    date not null default current_date,
  metric_key  text not null,          -- ex: 'sommeil', 'pas'  — doit correspondre
                                       -- au champ `key` défini côté site pour la métrique
  value       numeric not null,
  source      text not null default 'whatsapp',
  created_at  timestamptz not null default now()
);

create index if not exists metrics_log_date_key_idx on metrics_log (log_date, metric_key);

create table if not exists habits_log (
  id          uuid primary key default gen_random_uuid(),
  log_date    date not null default current_date,
  habit_key   text not null,          -- ex: 'sport', 'lecture'
  done        boolean not null default true,
  source      text not null default 'whatsapp',
  created_at  timestamptz not null default now()
);

create index if not exists habits_log_date_key_idx on habits_log (log_date, habit_key);

-- Un seul enregistrement "fait foi" par jour et par clé : la valeur la plus
-- récente écrase la précédente côté lecture (voir la vue ci-dessous),
-- sans jamais supprimer l'historique brut.

create or replace view metrics_log_latest as
select distinct on (log_date, metric_key)
  log_date, metric_key, value, created_at
from metrics_log
order by log_date, metric_key, created_at desc;

create or replace view habits_log_latest as
select distinct on (log_date, habit_key)
  log_date, habit_key, done, created_at
from habits_log
order by log_date, habit_key, created_at desc;
