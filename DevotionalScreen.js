// app/services/authService.js
// Manejo de registro, login y verificación de usuarios

import { supabase } from './supabase';

// === REGISTRO DE USUARIO ===
export const registerUser = async ({ email, password, fullName, phone, birthDate, gender }) => {
  try {
    // 1. Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          birth_date: birthDate,
          gender,
        },
        emailRedirectTo: null,
      },
    });

    if (error) throw error;

    // 2. Guardar datos adicionales en tabla usuarios
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email,
          full_name: fullName,
          phone,
          birth_date: birthDate,
          gender,
          is_premium: false,
          is_blocked: false,
          created_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;
    }

    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === INICIAR SESIÓN ===
export const loginUser = async ({ email, password }) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Verificar si el usuario está bloqueado
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_blocked')
      .eq('id', data.user.id)
      .single();

    if (profile?.is_blocked) {
      await supabase.auth.signOut();
      throw new Error('Tu cuenta ha sido bloqueada. Contacta al administrador.');
    }

    return { success: true, user: data.user, session: data.session };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === CERRAR SESIÓN ===
export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === VERIFICAR EMAIL ===
export const verifyEmail = async (token) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === OLVIDÉ MI CONTRASEÑA ===
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === OBTENER SESIÓN ACTUAL ===
export const getCurrentSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

// === OBTENER PERFIL DEL USUARIO ===
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { success: true, profile: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === ACTUALIZAR PERFIL ===
export const updateUserProfile = async (userId, updates) => {
  // Los usuarios NO pueden cambiar: email, phone, birth_date (seguridad)
  const allowedFields = ['full_name', 'avatar_url', 'language', 'notifications_enabled'];
  const safeUpdates = {};
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) safeUpdates[field] = updates[field];
  });

  try {
    const { error } = await supabase
      .from('user_profiles')
      .update(safeUpdates)
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
