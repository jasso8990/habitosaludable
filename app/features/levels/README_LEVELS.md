# Sistema de niveles (MVP)

## Reglas actuales
- +10 puntos por completar un hábito (solo la primera vez por día).
- Nivel = `floor(puntos / 100) + 1`.
- Insignias automáticas:
  - `Starter` (50 pts)
  - `Consistente` (200 pts)
  - `Imparable` (500 pts)

## Integración
- `awardHabitCompletionPoints` se llama desde `completeHabit`.
- `getUserLevel` se usa en `ProfileScreen` para mostrar nivel/progreso/insignias.

## Nota
La persistencia usa tabla `niveles` con RLS owner-only.
