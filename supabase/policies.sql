-- Habit Tracker — Row Level Security
-- À exécuter après schema.sql. Chaque table n'est lisible/écrivable que par
-- son propriétaire (auth.uid()) ; user_id est déjà rempli par défaut à
-- l'insertion, donc aucune jointure n'est nécessaire dans les policies.

alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table metrics enable row level security;
alter table metric_logs enable row level security;

create policy "habits_owner_all" on habits
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "habit_logs_owner_all" on habit_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "metrics_owner_all" on metrics
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "metric_logs_owner_all" on metric_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
