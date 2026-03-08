// app/services/notificationService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../supabase/client';
import { updatePushToken } from '../../features/auth/services/authService';
import { getNotificationPreferences } from './notificationPreferences';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true,
  }),
});

const parseTime = (time) => {
  const [hour, minute] = String(time || '08:00').split(':').map(Number);
  return {
    hour: Number.isFinite(hour) ? hour : 8,
    minute: Number.isFinite(minute) ? minute : 0,
  };
};

const isInQuietHours = (hour, quietStart, quietEnd) => {
  if (quietStart === quietEnd) return false;

  // Rango normal: 08->20 | Rango cruzado: 22->07
  if (quietStart < quietEnd) {
    return hour >= quietStart && hour < quietEnd;
  }

  return hour >= quietStart || hour < quietEnd;
};

const ensureNotificationChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('habits', {
    name: 'Hábitos',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#1E5F9E',
  });
  await Notifications.setNotificationChannelAsync('summary', {
    name: 'Resumen semanal',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#1E5F9E',
  });
};

export const requestNotificationPermission = async () => {
  if (!Device.isDevice) return { granted: false };

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;

  if (existing !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    status = newStatus;
  }

  await ensureNotificationChannel();

  if (status === 'granted') {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await updatePushToken(user.id, token);
    } catch {}
  }

  return { granted: status === 'granted' };
};

export const scheduleHabitReminder = async (habit) => {
  const { granted } = await requestNotificationPermission();
  if (!granted) return { success: false, reason: 'permission_denied' };

  try {
    const prefs = await getNotificationPreferences();
    const { hour, minute } = parseTime(habit.reminder_time);
    const days = habit.days_of_week || [1, 2, 3, 4, 5, 6, 7];
    const ids = [];

    const quietStart = parseTime(prefs.quietHoursStart).hour;
    const quietEnd = parseTime(prefs.quietHoursEnd).hour;
    const shouldSkipForQuietHours = prefs.quietHoursEnabled && isInQuietHours(hour, quietStart, quietEnd);

    if (shouldSkipForQuietHours) {
      return { success: false, reason: 'quiet_hours_conflict' };
    }

    for (const day of days) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌱 Hábitos Saludables',
          body: `¡Hora de: ${habit.title}!`,
          data: { habitId: habit.id, type: 'habit_reminder' },
          sound: true,
        },
        trigger: { weekday: day, hour, minute, repeats: true, channelId: 'habits' },
      });
      ids.push(id);
    }

    await supabase.from('habits').update({ notification_ids: ids }).eq('id', habit.id);
    return { success: true, ids };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const scheduleWeeklySummaryNotification = async () => {
  const { granted } = await requestNotificationPermission();
  if (!granted) return { success: false, reason: 'permission_denied' };

  const prefs = await getNotificationPreferences();
  if (!prefs.weeklySummaryEnabled) return { success: false, reason: 'disabled' };

  const { hour, minute } = parseTime(prefs.weeklySummaryTime);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Resumen semanal',
      body: 'Revisa tu avance semanal y comparte tu logro.',
      data: { type: 'weekly_summary' },
      sound: true,
    },
    trigger: {
      weekday: prefs.weeklySummaryDay,
      hour,
      minute,
      repeats: true,
      channelId: 'summary',
    },
  });

  return { success: true, id };
};

export const cancelHabitReminder = async (notificationIds) => {
  for (const id of notificationIds || []) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  }
};

export const sendAchievementNotification = async (message) => {
  await Notifications.scheduleNotificationAsync({
    content: { title: '🏆 ¡Logro Alcanzado!', body: message, sound: true },
    trigger: null,
  });
};

export const setupNotificationListeners = (onReceive, onResponse) => {
  const r = Notifications.addNotificationReceivedListener(onReceive);
  const s = Notifications.addNotificationResponseReceivedListener(onResponse);
  return () => {
    Notifications.removeNotificationSubscription(r);
    Notifications.removeNotificationSubscription(s);
  };
};
