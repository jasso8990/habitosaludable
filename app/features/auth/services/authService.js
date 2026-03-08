// app/services/authService.js
import { supabase } from '../../../core/supabase/client';
import { bootstrapUserE2EE } from '../../../core/security/e2eeBootstrap';

const normalizeProfile = ({ usersRow, legacyRow, authDataRow, authUser }) => {
  const fullName = legacyRow?.full_name || usersRow?.nombre || authUser?.user_metadata?.full_name || null;
  const gender = legacyRow?.gender || usersRow?.sexo || authUser?.user_metadata?.gender || null;
  const birthDate = legacyRow?.birth_date || usersRow?.fecha_nacimiento || authUser?.user_metadata?.birth_date || null;

  const isBlocked = legacyRow?.is_blocked ?? (usersRow?.estado === 'bloqueado');
  const isPremium = legacyRow?.is_premium ?? usersRow?.is_premium ?? false;

  return {
    id: legacyRow?.id || usersRow?.id || authUser?.id,
    full_name: fullName,
    gender,
    birth_date: birthDate,
    is_blocked: !!isBlocked,
    is_premium: !!isPremium,
    push_token: legacyRow?.push_token || usersRow?.push_token || null,
    email: authDataRow?.email || authUser?.email || null,
    phone: authDataRow?.telefono || legacyRow?.phone || null,
    block_reason: legacyRow?.block_reason || usersRow?.block_reason || null,
    estado: usersRow?.estado || (isBlocked ? 'bloqueado' : 'activo'),
  };
};

const loadUnifiedProfile = async (userId) => {
  const [usersRes, legacyRes, authDataRes, authRes] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('auth_data').select('email, telefono').eq('user_id', userId).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  return normalizeProfile({
    usersRow: usersRes.data,
    legacyRow: legacyRes.data,
    authDataRow: authDataRes.data,
    authUser: authRes?.data?.user,
  });
};

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

    const profile = await loadUnifiedProfile(data.user.id);
    if (profile?.is_blocked) {
      await supabase.auth.signOut();
      throw new Error('Tu cuenta ha sido suspendida. Contacta al administrador.');
    }

    await Promise.all([
      supabase.from('user_profiles').update({ last_active: new Date().toISOString() }).eq('id', data.user.id),
      supabase.from('users').update({ updated_at: new Date().toISOString() }).eq('id', data.user.id),
    ]);

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
    const profile = await loadUnifiedProfile(userId);
    return { success: true, profile };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updatePushToken = async (userId, token) => {
  await Promise.all([
    supabase.from('user_profiles').update({ push_token: token }).eq('id', userId),
    supabase.from('users').update({ push_token: token }).eq('id', userId),
  ]);
};
