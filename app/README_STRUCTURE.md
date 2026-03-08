# Estructura modular (carpetas pequeñas)

Este proyecto ahora está organizado por **core** y **features** para mantener carpetas pequeñas y facilitar mantenimiento.

## Core
- `app/core/navigation`: navegación principal.
- `app/core/supabase`: cliente de Supabase.
- `app/core/theme`: tokens/colores compartidos.
- `app/core/i18n`: traducciones y hook de idioma.
- `app/core/notifications`: permisos y listeners de notificaciones.

## Features
- `app/features/auth`: servicios de autenticación.
- `app/features/home`: pantalla principal.
- `app/features/assistant`: pantalla y servicio IA.
- `app/features/habits`: lógica de hábitos, componentes y detalle.
- `app/features/chat`: lista/chat y servicio de mensajería.
- `app/features/stories`: historias 24h.
- `app/features/devotional`: devocional.
- `app/features/weekly`: registro semanal.
- `app/features/profile`: perfil y ajustes.
- `app/features/premium`: vista premium.

## Regla de crecimiento
Si una carpeta supera ~8 archivos o mezcla UI + datos + utilidades, separar en:
- `screens/`
- `components/`
- `services/`
- `hooks/`
- `types/` (si se migra a TypeScript)
