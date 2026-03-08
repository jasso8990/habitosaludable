-- Devotional notes storage baseline for encrypted personal notes
create table if not exists public.devotional_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  devotional_id uuid not null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One note per user per devotional day/content
create unique index if not exists uq_devotional_notes_user_devotional
  on public.devotional_notes (user_id, devotional_id);

alter table public.devotional_notes enable row level security;

create policy if not exists "devotional_notes_select_own"
  on public.devotional_notes
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy if not exists "devotional_notes_insert_own"
  on public.devotional_notes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy if not exists "devotional_notes_update_own"
  on public.devotional_notes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "devotional_notes_delete_own"
  on public.devotional_notes
  for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.set_devotional_notes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_devotional_notes_updated_at on public.devotional_notes;
create trigger trg_devotional_notes_updated_at
before update on public.devotional_notes
for each row
execute function public.set_devotional_notes_updated_at();
