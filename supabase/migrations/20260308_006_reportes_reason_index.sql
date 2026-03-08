-- Improve report tracking payload and lookup performance.

create index if not exists idx_reportes_reporter_created on public.reportes(reporter_id, created_at desc);
create index if not exists idx_reportes_contenido_tipo on public.reportes(contenido_id, tipo);
