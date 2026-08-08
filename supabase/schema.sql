-- Habit Tracker — schéma de base (tables)
-- À exécuter dans l'éditeur SQL de votre projet Supabase, avant policies.sql.

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  frequency_type text not null check (frequency_type in ('daily', 'weekly_count', 'specific_weekdays')),
  frequency_target smallint,        -- utilisé par weekly_count, ex: 3x/semaine
  frequency_weekdays smallint[],    -- utilisé par specific_weekdays, 0=dim..6=sam
  archived boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  log_date date not null,
  completed boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, log_date)
);
create index if not exists habit_logs_user_date_idx on habit_logs (user_id, log_date desc);
create index if not exists habit_logs_habit_date_idx on habit_logs (habit_id, log_date desc);

create table if not exists metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  unit text not null,
  target_value numeric,
  target_direction text check (target_direction in ('at_least', 'at_most', 'exact')),
  decimals smallint not null default 0,
  color text,
  archived boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists metric_logs (
  id uuid primary key default gen_random_uuid(),
  metric_id uuid not null references metrics(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  log_date date not null,
  value numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (metric_id, log_date)
);
create index if not exists metric_logs_user_date_idx on metric_logs (user_id, log_date desc);
create index if not exists metric_logs_metric_date_idx on metric_logs (metric_id, log_date desc);

-- Maintient updated_at automatiquement sur les tables de logs (édition rétroactive fréquente).
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger habit_logs_set_updated_at
  before update on habit_logs
  for each row execute function set_updated_at();

create trigger metric_logs_set_updated_at
  before update on metric_logs
  for each row execute function set_updated_at();
