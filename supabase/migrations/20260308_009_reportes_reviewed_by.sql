-- Track which admin reviewed each report.

alter table public.reportes
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

create index if not exists idx_reportes_reviewed_by on public.reportes(reviewed_by);
