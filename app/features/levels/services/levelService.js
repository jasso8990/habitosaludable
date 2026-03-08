import { supabase } from '../../../core/supabase/client';

const BASE_POINTS_PER_COMPLETION = 10;

export const calculateLevelFromPoints = (points = 0) => {
  const safePoints = Math.max(0, Number(points) || 0);
  const level = Math.floor(safePoints / 100) + 1;
  const levelStart = (level - 1) * 100;
  const nextLevelAt = level * 100;

  return {
    level,
    safePoints,
    progressInLevel: safePoints - levelStart,
    pointsToNextLevel: Math.max(0, nextLevelAt - safePoints),
    nextLevelAt,
  };
};

const normalizeBadges = (insignias, points) => {
  const current = Array.isArray(insignias) ? [...insignias] : [];

  const badgeRules = [
    { id: 'starter', minPoints: 50, label: 'Starter' },
    { id: 'consistent', minPoints: 200, label: 'Consistente' },
    { id: 'unstoppable', minPoints: 500, label: 'Imparable' },
  ];

  for (const badge of badgeRules) {
    if (points >= badge.minPoints && !current.some((b) => b?.id === badge.id)) {
      current.push({ id: badge.id, label: badge.label, unlockedAt: new Date().toISOString() });
    }
  }

  return current;
};

export const getUserLevel = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('niveles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const computed = calculateLevelFromPoints(data?.puntos || 0);
    return {
      success: true,
      levelData: {
        ...data,
        nivel_actual: computed.level,
        puntos: computed.safePoints,
        insignias: Array.isArray(data?.insignias) ? data.insignias : [],
        ...computed,
      },
    };
  } catch {
    return {
      success: true,
      levelData: {
        nivel_actual: 1,
        puntos: 0,
        insignias: [],
        ...calculateLevelFromPoints(0),
      },
    };
  }
};

export const awardHabitCompletionPoints = async (userId, points = BASE_POINTS_PER_COMPLETION) => {
  try {
    const safePoints = Math.max(1, Number(points) || BASE_POINTS_PER_COMPLETION);

    const { data: existing, error: readError } = await supabase
      .from('niveles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (readError) throw readError;

    const previousPoints = existing?.puntos || 0;
    const updatedPoints = previousPoints + safePoints;
    const computed = calculateLevelFromPoints(updatedPoints);
    const insignias = normalizeBadges(existing?.insignias, updatedPoints);

    const payload = {
      user_id: userId,
      puntos: updatedPoints,
      nivel_actual: computed.level,
      insignias,
      updated_at: new Date().toISOString(),
    };

    const { error: writeError } = await supabase
      .from('niveles')
      .upsert(payload, { onConflict: 'user_id' });

    if (writeError) throw writeError;

    return {
      success: true,
      pointsAwarded: safePoints,
      levelData: {
        ...payload,
        ...computed,
      },
      leveledUp: computed.level > (existing?.nivel_actual || 1),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
