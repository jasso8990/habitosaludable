-- Ensure niveles table exists and has owner-only RLS for app level system.

create table if not exists public.niveles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nivel_actual int not null default 1,
  puntos int not null default 0,
  insignias jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.niveles enable row level security;

drop policy if exists "niveles_owner_only" on public.niveles;
create policy "niveles_owner_only" on public.niveles
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.touch_niveles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_niveles_touch_updated_at on public.niveles;
create trigger trg_niveles_touch_updated_at
before update on public.niveles
for each row
execute function public.touch_niveles_updated_at();
