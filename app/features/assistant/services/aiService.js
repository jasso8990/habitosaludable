// app/services/aiService.js
import { supabase, SUPABASE_FUNCTIONS_URL } from '../../../core/supabase/client';

const callFunction = async (fnName, body) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
};

export const sendMessageToAssistant = async (messages, userProfile) => {
  try {
    const context = userProfile ? `Usuario: ${userProfile.full_name}, hábitos activos: ${userProfile.habitCount || 0}` : '';
    const data = await callFunction('ai-assistant', { messages, context });
    return { success: true, message: data.message, habitPlan: data.habitPlan };
  } catch (error) {
    return { success: false, error: error.message, message: 'Error al conectar con el asistente.' };
  }
};

export const generateCertificateMessage = async (percentage, habitTitle, period, language = 'es') => {
  try {
    const data = await callFunction('generate-certificate', { percentage, habitTitle, period, language });
    return { success: true, message: data.message };
  } catch {
    const msg = language === 'es'
      ? `¡Felicidades! Completaste el ${percentage}% de tu meta. ¡Sigue así!`
      : `Congratulations! You completed ${percentage}% of your goal!`;
    return { success: true, message: msg };
  }
};
