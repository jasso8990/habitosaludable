// app/services/notificationService.js
// Manejo de notificaciones push para recordatorios de hábitos

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configurar cómo se muestran las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// === PEDIR PERMISO PARA NOTIFICACIONES ===
export const requestNotificationPermission = async () => {
  if (!Device.isDevice) {
    return { granted: false, reason: 'Necesita un dispositivo real' };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habits', {
      name: 'Recordatorios de Hábitos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1E5F9E',
    });
  }

  return { granted: finalStatus === 'granted' };
};

// === PROGRAMAR RECORDATORIO DE HÁBITO ===
export const scheduleHabitReminder = async (habit) => {
  try {
    const { granted } = await requestNotificationPermission();
    if (!granted) return { success: false, error: 'Permisos de notificación no concedidos' };

    const [hour, minute] = habit.reminderTime.split(':').map(Number);
    const daysOfWeek = habit.daysOfWeek || [1, 2, 3, 4, 5, 6, 7];

    const notificationIds = [];

    for (const dayOfWeek of daysOfWeek) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌱 Hábitos Saludables',
          body: `¡Hora de: ${habit.title}! ¿Lo completarás hoy?`,
          data: { habitId: habit.id, type: 'habit_reminder' },
          sound: true,
        },
        trigger: {
          weekday: dayOfWeek, // 1=domingo, 2=lunes... en Expo
          hour,
          minute,
          repeats: true,
        },
      });
      notificationIds.push(id);
    }

    // Guardar IDs en la base de datos
    await supabase
      .from('habits')
      .update({ notification_ids: notificationIds })
      .eq('id', habit.id);

    return { success: true, notificationIds };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === CANCELAR RECORDATORIO ===
export const cancelHabitReminder = async (notificationIds) => {
  try {
    for (const id of notificationIds || []) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === ENVIAR NOTIFICACIÓN DE LOGRO ===
export const sendAchievementNotification = async (message, title = '🏆 ¡Logro Alcanzado!') => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: message,
        data: { type: 'achievement' },
        sound: true,
      },
      trigger: null, // Inmediata
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === ESCUCHAR NOTIFICACIONES (en App.js) ===
export const setupNotificationListeners = (onReceive, onResponse) => {
  const receiveListener = Notifications.addNotificationReceivedListener(onReceive);
  const responseListener = Notifications.addNotificationResponseReceivedListener(onResponse);

  return () => {
    Notifications.removeNotificationSubscription(receiveListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
};
