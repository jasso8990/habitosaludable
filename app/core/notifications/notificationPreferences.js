import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'notification:preferences:v1';

export const defaultNotificationPreferences = {
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  weeklySummaryEnabled: true,
  weeklySummaryDay: 7,
  weeklySummaryTime: '20:00',
};

const parseJson = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getNotificationPreferences = async () => {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  const parsed = parseJson(raw);
  return { ...defaultNotificationPreferences, ...(parsed || {}) };
};

export const setNotificationPreferences = async (nextPreferences) => {
  const current = await getNotificationPreferences();
  const merged = { ...current, ...nextPreferences };
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(merged));
  return merged;
};
