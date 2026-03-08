-- MVP backend + RLS baseline
-- Privacy-first model: admin cannot access private auth_data or E2EE payloads.

create extension if not exists "pgcrypto";

-- =====================================================
-- Core profile tables
-- =====================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  sexo text not null check (sexo in ('male', 'female', 'other', 'prefer_not_to_say')),
  fecha_nacimiento date not null,
  edad_calculada int,
  rol text not null default 'user' check (rol in ('user', 'admin')),
  estado text not null default 'activo' check (estado in ('activo', 'bloqueado', 'restringido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.auth_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  telefono text not null,
  telefono_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- Product tables
-- =====================================================
create table if not exists public.metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  encrypted_content text not null,
  configuracion_habito jsonb not null default '{}'::jsonb,
  progreso_encriptado text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.historias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contenido text not null,
  tipo text not null check (tipo in ('texto', 'imagen', 'video')),
  fecha_expiracion timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('1a1', 'grupo')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_room_members (
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.mensajes (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  encrypted_payload text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.niveles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nivel_actual int not null default 1,
  puntos int not null default 0,
  insignias jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.reportes (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  contenido_id uuid not null,
  tipo text not null check (tipo in ('historia', 'usuario', 'chat')),
  snapshot_contenido jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.bloqueos (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- =====================================================
-- Utility functions
-- =====================================================
create or replace function public.calculate_age(fecha date)
returns int
language sql
stable
as $$
  select extract(year from age(now(), fecha))::int;
$$;

create or replace function public.enforce_minimum_age_13()
returns trigger
language plpgsql
as $$
begin
  new.edad_calculada := public.calculate_age(new.fecha_nacimiento);

  if new.edad_calculada < 13 then
    raise exception 'Edad mínima requerida: 13 años';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_users_age_validation on public.users;
create trigger trg_users_age_validation
before insert or update of fecha_nacimiento on public.users
for each row
execute function public.enforce_minimum_age_13();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_users_touch_updated_at on public.users;
create trigger trg_users_touch_updated_at
before update on public.users
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_auth_data_touch_updated_at on public.auth_data;
create trigger trg_auth_data_touch_updated_at
before update on public.auth_data
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_metas_touch_updated_at on public.metas;
create trigger trg_metas_touch_updated_at
before update on public.metas
for each row
execute function public.touch_updated_at();

-- =====================================================
-- RLS
-- =====================================================
alter table public.users enable row level security;
alter table public.auth_data enable row level security;
alter table public.metas enable row level security;
alter table public.historias enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.chat_room_members enable row level security;
alter table public.mensajes enable row level security;
alter table public.niveles enable row level security;
alter table public.reportes enable row level security;
alter table public.bloqueos enable row level security;

-- users: self access + limited admin visibility
create policy "users_self_read" on public.users
for select using (auth.uid() = id);

create policy "users_self_write" on public.users
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "users_admin_read_limited" on public.users
for select using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.rol = 'admin'
  )
);

-- auth_data: strictly private to owner only
create policy "auth_data_owner_only" on public.auth_data
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- metas: owner only (E2EE payload)
create policy "metas_owner_only" on public.metas
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- historias: owner read/write + public read if not expired
create policy "historias_owner_manage" on public.historias
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "historias_active_read" on public.historias
for select using (fecha_expiracion > now());

-- chat membership guards
create policy "chat_rooms_member_read" on public.chat_rooms
for select using (
  exists (
    select 1 from public.chat_room_members m
    where m.room_id = id and m.user_id = auth.uid()
  )
);

create policy "chat_rooms_creator_insert" on public.chat_rooms
for insert with check (created_by = auth.uid());

create policy "chat_room_members_member_read" on public.chat_room_members
for select using (user_id = auth.uid());

create policy "chat_room_members_self_insert" on public.chat_room_members
for insert with check (user_id = auth.uid());

create policy "mensajes_member_read" on public.mensajes
for select using (
  exists (
    select 1 from public.chat_room_members m
    where m.room_id = chat_id and m.user_id = auth.uid()
  )
);

create policy "mensajes_sender_insert" on public.mensajes
for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.chat_room_members m
    where m.room_id = chat_id and m.user_id = auth.uid()
  )
);

-- niveles owner-only
create policy "niveles_owner_only" on public.niveles
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reportes: any authenticated user can create/read own reports; admin can read all
create policy "reportes_owner_create_read" on public.reportes
for all using (auth.uid() = reporter_id) with check (auth.uid() = reporter_id);

create policy "reportes_admin_read" on public.reportes
for select using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.rol = 'admin'
  )
);

-- bloqueos owner-only
create policy "bloqueos_owner_only" on public.bloqueos
for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- Helpful indexes
create index if not exists idx_metas_user_id on public.metas(user_id);
create index if not exists idx_historias_exp on public.historias(fecha_expiracion);
create index if not exists idx_mensajes_chat_id_created on public.mensajes(chat_id, created_at desc);
create index if not exists idx_reportes_tipo_created on public.reportes(tipo, created_at desc);
