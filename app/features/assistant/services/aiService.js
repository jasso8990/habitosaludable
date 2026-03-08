// app/services/aiService.js
import { supabase, SUPABASE_FUNCTIONS_URL } from '../../../core/supabase/client';

const FALLBACK_ASSISTANT_ERROR = 'No pude conectarme al asistente en este momento. Intenta nuevamente en unos segundos.';
const REQUEST_TIMEOUT_MS = 15000;

const withTimeout = async (promise, timeoutMs = REQUEST_TIMEOUT_MS) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Tiempo de espera agotado para la función IA')), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const normalizeMessages = (messages = []) => {
  return messages
    .filter((m) => typeof m?.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 1200) }))
    .filter((m) => m.content.length > 0);
};

const buildAssistantContext = (userProfile) => {
  if (!userProfile) return null;

  return {
    locale: userProfile.preferred_language || 'es',
    isPremium: !!userProfile.is_premium,
    habitCount: userProfile.habitCount || 0,
    firstName: userProfile.full_name ? userProfile.full_name.split(' ')[0] : 'Usuario',
    guidanceStyle: 'motivacional-profesional',
  };
};

const callFunction = async (fnName, body) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('Sesión no disponible para llamar a funciones protegidas');
  }

  const response = await withTimeout(fetch(`${SUPABASE_FUNCTIONS_URL}/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  }));

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(`Error HTTP ${response.status} (${fnName}): ${errorPayload}`);
  }

  return response.json();
};

const validateAssistantPayload = (payload) => {
  if (!payload || typeof payload.message !== 'string') {
    throw new Error('Respuesta IA inválida: falta campo message');
  }

  const safeMessage = payload.message.trim();
  if (!safeMessage) {
    throw new Error('Respuesta IA inválida: message vacío');
  }

  const safeHabitPlan = payload.habitPlan && typeof payload.habitPlan === 'object'
    ? {
        title: String(payload.habitPlan.title || '').trim(),
        description: String(payload.habitPlan.description || '').trim(),
        category: String(payload.habitPlan.category || 'otro').trim(),
        frequency: String(payload.habitPlan.frequency || 'daily').trim(),
        daysOfWeek: Array.isArray(payload.habitPlan.daysOfWeek) ? payload.habitPlan.daysOfWeek : [1, 2, 3, 4, 5, 6, 7],
        reminderTime: String(payload.habitPlan.reminderTime || '08:00').trim(),
        timesPerDay: Number(payload.habitPlan.timesPerDay || 1),
      }
    : null;

  return { message: safeMessage, habitPlan: safeHabitPlan };
};

const retryOnce = async (fn) => {
  try {
    return await fn();
  } catch (firstError) {
    return fn().catch(() => {
      throw firstError;
    });
  }
};

export const sendMessageToAssistant = async (messages, userProfile) => {
  try {
    const payload = {
      messages: normalizeMessages(messages),
      context: buildAssistantContext(userProfile),
      safety: {
        minAgePolicy: 13,
        refuseMedicalDiagnosis: true,
      },
    };

    const data = await retryOnce(() => callFunction('ai-assistant', payload));
    const normalized = validateAssistantPayload(data);

    return { success: true, message: normalized.message, habitPlan: normalized.habitPlan };
  } catch (error) {
    return { success: false, error: error.message, message: FALLBACK_ASSISTANT_ERROR };
  }
};

export const generateCertificateMessage = async (percentage, habitTitle, period, language = 'es') => {
  try {
    const data = await retryOnce(() => callFunction('generate-certificate', { percentage, habitTitle, period, language }));
    if (!data?.message || typeof data.message !== 'string') throw new Error('Respuesta inválida de generate-certificate');
    return { success: true, message: data.message.trim() };
  } catch {
    const msg = language === 'es'
      ? `¡Felicidades! Completaste el ${percentage}% de tu meta. ¡Sigue así!`
      : `Congratulations! You completed ${percentage}% of your goal!`;
    return { success: true, message: msg };
  }
};
