// app/services/habitService.js
// Crear, editar, eliminar y registrar hábitos

import { supabase } from './supabase';

const FREE_HABIT_LIMIT = 3; // Límite de hábitos para usuarios gratis

// === CREAR HÁBITO ===
export const createHabit = async (userId, habitData, isPremium) => {
  try {
    // Verificar límite para usuarios gratis
    if (!isPremium) {
      const { count } = await supabase
        .from('habits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (count >= FREE_HABIT_LIMIT) {
        return {
          success: false,
          limitReached: true,
          error: 'Has alcanzado el límite de 3 hábitos gratuitos.',
        };
      }
    }

    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: userId,
        title: habitData.title,
        description: habitData.description,
        category: habitData.category,
        frequency: habitData.frequency,       // 'daily', 'weekdays', 'custom'
        days_of_week: habitData.daysOfWeek,   // [1,2,3,4,5] (lunes=1)
        reminder_time: habitData.reminderTime, // '07:00'
        times_per_day: habitData.timesPerDay || 1,
        start_date: new Date().toISOString(),
        is_active: true,
        streak: 0,
        total_completions: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, habit: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === OBTENER HÁBITOS DEL USUARIO ===
export const getUserHabits = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, habits: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === MARCAR HÁBITO COMO COMPLETADO ===
export const completeHabit = async (userId, habitId, date) => {
  try {
    const today = date || new Date().toISOString().split('T')[0];

    // Verificar si ya lo completó hoy
    const { data: existing } = await supabase
      .from('habit_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('date', today)
      .single();

    if (existing) {
      return { success: true, alreadyCompleted: true };
    }

    // Registrar completación
    const { error } = await supabase
      .from('habit_completions')
      .insert({
        user_id: userId,
        habit_id: habitId,
        date: today,
        completed_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Actualizar racha y total
    await updateHabitStreak(userId, habitId);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === ACTUALIZAR RACHA DEL HÁBITO ===
const updateHabitStreak = async (userId, habitId) => {
  const { data: completions } = await supabase
    .from('habit_completions')
    .select('date')
    .eq('habit_id', habitId)
    .order('date', { ascending: false })
    .limit(30);

  if (!completions) return;

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < completions.length; i++) {
    const date = new Date(completions[i].date);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    const isSameDay = date.toDateString() === expectedDate.toDateString();
    if (isSameDay) {
      streak++;
    } else {
      break;
    }
  }

  await supabase
    .from('habits')
    .update({ streak, total_completions: completions.length })
    .eq('id', habitId);
};

// === OBTENER PROGRESO SEMANAL ===
export const getWeeklyProgress = async (userId) => {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];

  try {
    const { data, error } = await supabase
      .from('habit_completions')
      .select('habit_id, date')
      .eq('user_id', userId)
      .gte('date', weekStartStr);

    if (error) throw error;

    const { data: habits } = await supabase
      .from('habits')
      .select('id, title, frequency, days_of_week')
      .eq('user_id', userId)
      .eq('is_active', true);

    // Calcular porcentaje
    const completedIds = new Set(data?.map(c => c.habit_id));
    const totalHabits = habits?.length || 0;
    const completedHabits = habits?.filter(h => completedIds.has(h.id)).length || 0;
    const percentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

    return {
      success: true,
      completions: data,
      percentage,
      totalHabits,
      completedHabits,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === ELIMINAR HÁBITO (desactivar) ===
export const deleteHabit = async (habitId) => {
  try {
    const { error } = await supabase
      .from('habits')
      .update({ is_active: false })
      .eq('id', habitId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
