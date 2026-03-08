// app/services/habitService.js
import { supabase } from '../../../core/supabase/client';
import { awardHabitCompletionPoints } from '../../levels/services/levelService';

const FREE_LIMIT = 3;

export const createHabit = async (userId, habitData, isPremium) => {
  try {
    if (!isPremium) {
      const { count } = await supabase.from('habits')
        .select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true);
      if (count >= FREE_LIMIT) return { success: false, limitReached: true };
    }

    const { data, error } = await supabase.from('habits').insert({
      user_id: userId,
      title: habitData.title,
      description: habitData.description || '',
      category: habitData.category || 'otro',
      frequency: habitData.frequency || 'daily',
      days_of_week: habitData.daysOfWeek || [1,2,3,4,5,6,7],
      reminder_time: habitData.reminderTime || '08:00',
      times_per_day: habitData.timesPerDay || 1,
    }).select().single();

    if (error) throw error;
    return { success: true, habit: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserHabits = async (userId) => {
  try {
    const { data, error } = await supabase.from('habits')
      .select('*').eq('user_id', userId).eq('is_active', true).order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, habits: data };
  } catch (error) {
    return { success: false, habits: [] };
  }
};

export const getTodayHabits = (habits) => {
  const today = new Date().getDay(); // 0=Sun
  const dayMap = { 0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
  const todayNum = dayMap[today];
  return habits.filter(h => {
    if (h.frequency === 'daily') return true;
    if (h.frequency === 'weekdays') return todayNum >= 1 && todayNum <= 5;
    return h.days_of_week?.includes(todayNum);
  });
};

export const completeHabit = async (userId, habitId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('habit_completions').insert({
      user_id: userId, habit_id: habitId, date: today
    });

    const alreadyCompleted = error?.code === '23505';
    if (error && !alreadyCompleted) throw error; // 23505 = unique violation (ya completado)

    if (!alreadyCompleted) {
      await awardHabitCompletionPoints(userId);
    }

    await updateStreak(habitId);
    return { success: true, alreadyCompleted };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const updateStreak = async (habitId) => {
  const { data } = await supabase.from('habit_completions').select('date')
    .eq('habit_id', habitId).order('date', { ascending: false }).limit(60);
  if (!data?.length) return;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < data.length; i++) {
    const d = new Date(data[i].date);
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (d.toDateString() === expected.toDateString()) streak++;
    else break;
  }
  await supabase.from('habits').update({ streak, total_completions: data.length }).eq('id', habitId);
};

export const getTodayCompletions = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase.from('habit_completions')
    .select('habit_id').eq('user_id', userId).eq('date', today);
  return new Set(data?.map(c => c.habit_id) || []);
};

export const getWeeklyProgress = async (userId) => {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const [{ data: completions }, { data: habits }] = await Promise.all([
    supabase.from('habit_completions').select('habit_id, date').eq('user_id', userId).gte('date', weekStartStr),
    supabase.from('habits').select('id').eq('user_id', userId).eq('is_active', true),
  ]);

  const completedIds = new Set(completions?.map(c => c.habit_id) || []);
  const total = habits?.length || 0;
  const completed = habits?.filter(h => completedIds.has(h.id)).length || 0;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { percentage, completedHabits: completed, totalHabits: total };
};

export const deleteHabit = async (habitId) => {
  const { error } = await supabase.from('habits').update({ is_active: false }).eq('id', habitId);
  return { success: !error };
};

export const getHabitCount = async (userId) => {
  const { count } = await supabase.from('habits')
    .select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true);
  return count || 0;
};
