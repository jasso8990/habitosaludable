# Supabase backend baseline

Este directorio contiene la base inicial del backend para el MVP con enfoque privacy-first.

## Incluye
- Esquema de tablas principales del producto.
- Trigger para validar edad mínima de 13 años.
- Políticas RLS para proteger datos E2EE y auth_data.
- Restricción de acceso admin (sin acceso a email/teléfono ni payload E2EE).

## Aplicación
1. Abrir SQL Editor en Supabase.
2. Ejecutar `supabase/migrations/20260308_001_mvp_backend_rls.sql`.
3. Verificar que RLS quedó habilitado y políticas creadas.

## Nota
Este baseline se debe adaptar con migraciones incrementales cuando se integre completamente con las tablas actuales (`user_profiles`, `habits`, etc.).
