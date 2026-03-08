# AI Integration (MVP)

Este módulo consume funciones de Supabase (`ai-assistant` y `generate-certificate`) como capa segura para OpenAI.

## Principios aplicados
- El cliente **no** usa directamente la API key de OpenAI.
- Requests autenticadas con token de Supabase.
- Timeout y reintento simple para resiliencia.
- Sanitización de historial y contexto mínimo.
- Validación estricta de payload de respuesta antes de renderizar/crear hábitos.

## Contrato esperado de `ai-assistant`
```json
{
  "message": "string",
  "habitPlan": {
    "title": "string",
    "description": "string",
    "category": "otro|...",
    "frequency": "daily|weekdays|custom",
    "daysOfWeek": [1,2,3,4,5,6,7],
    "reminderTime": "08:00",
    "timesPerDay": 1
  }
}
```

Si `habitPlan` no existe o es inválido, el chat sigue operativo y solo muestra `message`.
