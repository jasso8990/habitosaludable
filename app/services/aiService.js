// app/services/aiService.js
// Asistente IA usando Claude de Anthropic

import Constants from 'expo-constants';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || Constants.expoConfig?.extra?.anthropicApiKey;
const API_URL = 'https://api.anthropic.com/v1/messages';

// Sistema base del asistente
const SYSTEM_PROMPT = `Eres un asistente experto en desarrollo de hábitos saludables para la app "Hábitos Saludables". 
Tu función es ayudar a los usuarios a crear hábitos sólidos basándote en:

1. **Hábitos Atómicos (James Clear)**: 
   - Hacer los hábitos obvios, atractivos, fáciles y satisfactorios
   - Comenzar con hábitos muy pequeños (1% mejor cada día)
   - Usar la regla de los 2 minutos para empezar
   - Crear sistemas, no solo metas

2. **Seminario Fénix**:
   - Definir claramente la visión personal
   - Convertir metas ambiguas en acciones concretas
   - Celebrar cada pequeño logro

3. **Dale Carnegie**:
   - Motivar desde el reconocimiento y el aliento
   - Ser genuinamente interesado en el progreso del usuario
   - Siempre hablar en términos positivos

REGLAS DE CONVERSACIÓN:
- Habla en el idioma en que el usuario se exprese (español o inglés)
- Sé cálido, motivador y práctico
- Convierte metas ambiguas en planes SMART (Específico, Medible, Alcanzable, Relevante, con Tiempo)
- Sugiere horarios realistas
- Siempre termina con una frase motivadora
- Cuando el usuario defina una meta, extrae: título, descripción, frecuencia, horario, días

Cuando tengas suficiente información para crear un plan, responde en formato JSON así:
{
  "type": "habit_plan",
  "title": "Nombre del hábito",
  "description": "Descripción breve",
  "category": "salud|espiritual|relaciones|estudio|ejercicio|otro",
  "frequency": "daily|weekdays|custom",
  "daysOfWeek": [1,2,3,4,5,6,7],
  "reminderTime": "07:00",
  "timesPerDay": 1,
  "message": "Mensaje motivador para el usuario"
}

Si no tienes suficiente información, solo responde con texto normal y haz preguntas.`;

// === ENVIAR MENSAJE AL ASISTENTE ===
export const sendMessageToAssistant = async (messages, userMessage) => {
  try {
    const conversationMessages = [
      ...messages,
      { role: 'user', content: userMessage }
    ];

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: conversationMessages,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.content[0].text;

    // Intentar parsear como plan de hábito
    let habitPlan = null;
    try {
      const jsonMatch = assistantMessage.match(/\{[\s\S]*"type":\s*"habit_plan"[\s\S]*\}/);
      if (jsonMatch) {
        habitPlan = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // No es JSON, es texto normal
    }

    return {
      success: true,
      message: assistantMessage,
      habitPlan,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === GENERAR MENSAJE DE CERTIFICADO ===
export const generateCertificateMessage = async (percentage, habitTitle, period, language = 'es') => {
  const prompt = language === 'es'
    ? `Genera un mensaje de felicitación corto y motivador (máximo 3 oraciones) para alguien que completó el ${percentage}% de su hábito "${habitTitle}" durante ${period}. Usa el estilo de Dale Carnegie: positivo, cálido y alentador.`
    : `Generate a short motivational congratulation message (max 3 sentences) for someone who completed ${percentage}% of their habit "${habitTitle}" during ${period}. Use Dale Carnegie style: positive, warm and encouraging.`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    return { success: true, message: data.content[0].text };
  } catch (error) {
    return {
      success: true,
      message: language === 'es'
        ? `¡Felicidades! Completaste el ${percentage}% de tu meta. ¡Sigue así, cada día eres mejor!`
        : `Congratulations! You completed ${percentage}% of your goal. Keep it up, you get better every day!`
    };
  }
};

// === SUGERENCIAS DE HÁBITOS ===
export const getHabitSuggestions = async (category, language = 'es') => {
  const prompt = language === 'es'
    ? `Dame 5 sugerencias de hábitos saludables en la categoría "${category}" basadas en Hábitos Atómicos. Responde solo con una lista JSON: [{"title": "", "description": "", "reminderTime": ""}]`
    : `Give me 5 healthy habit suggestions in the category "${category}" based on Atomic Habits. Respond only with a JSON list: [{"title": "", "description": "", "reminderTime": ""}]`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content[0].text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return { success: true, suggestions: JSON.parse(jsonMatch[0]) };
    }
    return { success: false, suggestions: [] };
  } catch (error) {
    return { success: false, suggestions: [] };
  }
};
