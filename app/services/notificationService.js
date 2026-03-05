// app/services/notificationService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { updatePushToken } from './authService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true,
  }),
});

export const requestNotificationPermission = async () => {
  if (!Device.isDevice) return { granted: false };
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    status = newStatus;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habits', {
      name: 'Hábitos', importance: Notifications.AndroidImportance.HIGH, lightColor: '#1E5F9E',
    });
  }
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
  if (!granted) return { success: false };

  try {
    const [hour, minute] = habit.reminder_time.split(':').map(Number);
    const days = habit.days_of_week || [1,2,3,4,5,6,7];
    const ids = [];

    for (const day of days) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌱 Hábitos Saludables',
          body: `¡Hora de: ${habit.title}!`,
          data: { habitId: habit.id, type: 'habit_reminder' },
        },
        trigger: { weekday: day, hour, minute, repeats: true },
      });
      ids.push(id);
    }

    await supabase.from('habits').update({ notification_ids: ids }).eq('id', habit.id);
    return { success: true, ids };
  } catch (error) {
    return { success: false, error: error.message };
  }
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
  return () => { Notifications.removeNotificationSubscription(r); Notifications.removeNotificationSubscription(s); };
};
