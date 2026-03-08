-- User key registry for E2EE bootstrap

create table if not exists public.user_keyring (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_key text not null,
  algorithm text not null default 'RSA-OAEP-2048-SHA256',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_keyring enable row level security;

create policy "user_keyring_owner_manage" on public.user_keyring
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_keyring_authenticated_read" on public.user_keyring
for select using (auth.role() = 'authenticated');

create or replace function public.touch_user_keyring_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_user_keyring_touch_updated_at on public.user_keyring;
create trigger trg_user_keyring_touch_updated_at
before update on public.user_keyring
for each row
execute function public.touch_user_keyring_updated_at();
