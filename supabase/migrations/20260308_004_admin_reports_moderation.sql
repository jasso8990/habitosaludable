-- Admin moderation fields for reportes lifecycle

alter table public.reportes
  add column if not exists estado text not null default 'pendiente' check (estado in ('pendiente','resuelto','descartado')),
  add column if not exists reviewed_at timestamptz;

create index if not exists idx_reportes_estado_created on public.reportes(estado, created_at desc);
