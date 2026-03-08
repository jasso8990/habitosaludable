// app/services/authService.js
import { supabase } from '../../../core/supabase/client';
import { bootstrapUserE2EE } from '../../../core/security/e2eeBootstrap';

export const registerUser = async ({ email, password, fullName, phone, birthDate, gender }) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: { full_name: fullName, phone, birth_date: birthDate, gender },
      },
    });
    if (error) throw error;

    if (data.user?.id) {
      await bootstrapUserE2EE(data.user.id);
    }

    return { success: true, user: data.user, needsVerification: !data.session };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginUser = async ({ email, password }) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.toLowerCase().trim(), password });
    if (error) throw error;

    // Verificar si está bloqueado
    const { data: profile } = await supabase
      .from('user_profiles').select('is_blocked').eq('id', data.user.id).single();
    if (profile?.is_blocked) {
      await supabase.auth.signOut();
      throw new Error('Tu cuenta ha sido suspendida. Contacta al administrador.');
    }

    // Actualizar last_active
    await supabase.from('user_profiles').update({ last_active: new Date().toISOString() }).eq('id', data.user.id);

    try {
      await bootstrapUserE2EE(data.user.id);
    } catch (e) {
      await supabase.auth.signOut();
      throw new Error(`No se pudo inicializar la seguridad E2EE: ${e.message}`);
    }

    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  await supabase.auth.signOut();
};

export const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim());
  return { success: !error, error: error?.message };
};

export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return { success: true, profile: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updatePushToken = async (userId, token) => {
  await supabase.from('user_profiles').update({ push_token: token }).eq('id', userId);
};
