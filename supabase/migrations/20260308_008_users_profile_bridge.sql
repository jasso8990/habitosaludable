-- Bridge columns to support migration from legacy user_profiles to users.

alter table public.users
  add column if not exists is_premium boolean not null default false,
  add column if not exists push_token text,
  add column if not exists block_reason text;

create index if not exists idx_users_estado_rol on public.users(estado, rol);
