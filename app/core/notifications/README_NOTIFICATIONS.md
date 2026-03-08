# Smart notifications (MVP)

Este módulo implementa push/local notifications con reglas mínimas inteligentes.

## Incluye
- Canal `habits` para recordatorios de hábitos.
- Canal `summary` para recordatorio semanal.
- Horas silenciosas (quiet hours) persistidas localmente en SecureStore.
- Scheduling de resumen semanal con día/hora configurable.

## Preferencias (locales por dispositivo)
Se almacenan en `notification:preferences:v1`:
- `quietHoursEnabled`
- `quietHoursStart`
- `quietHoursEnd`
- `weeklySummaryEnabled`
- `weeklySummaryDay`
- `weeklySummaryTime`

## Comportamiento
Si un hábito cae dentro del rango silencioso, el recordatorio no se agenda y retorna `reason: quiet_hours_conflict`.
