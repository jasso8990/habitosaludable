-- Prevent duplicate pending reports for same reporter/content/type.

create unique index if not exists uq_reportes_pending_per_user_content
on public.reportes(reporter_id, contenido_id, tipo)
where estado = 'pendiente';
