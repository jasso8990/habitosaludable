-- Allow admin users to moderate reportes status fields.

drop policy if exists "reportes_admin_update" on public.reportes;

create policy "reportes_admin_update" on public.reportes
for update using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.rol = 'admin'
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.rol = 'admin'
  )
);
