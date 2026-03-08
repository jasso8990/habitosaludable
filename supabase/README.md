# Supabase backend baseline

Este directorio contiene la base inicial del backend para el MVP con enfoque privacy-first.

## Incluye
- Esquema de tablas principales del producto.
- Trigger para validar edad mínima de 13 años.
- Políticas RLS para proteger datos E2EE y auth_data.
- Restricción de acceso admin (sin acceso a email/teléfono ni payload E2EE).
- Registro de llaves públicas de usuario para bootstrap E2EE (`user_keyring`).

## Aplicación
1. Abrir SQL Editor en Supabase.
2. Ejecutar en orden:
   - `supabase/migrations/20260308_001_mvp_backend_rls.sql`
   - `supabase/migrations/20260308_002_user_keyring.sql`
   - `supabase/migrations/20260308_003_levels_hardening.sql`
   - `supabase/migrations/20260308_004_admin_reports_moderation.sql`
   - `supabase/migrations/20260308_005_admin_reportes_update_policy.sql`
   - `supabase/migrations/20260308_006_reportes_reason_index.sql`
   - `supabase/migrations/20260308_007_reportes_pending_unique.sql`
3. Verificar que RLS quedó habilitado y políticas creadas.

## Nota
Este baseline se debe adaptar con migraciones incrementales cuando se integre completamente con las tablas actuales (`user_profiles`, `habits`, etc.).
