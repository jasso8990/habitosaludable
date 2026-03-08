import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './app/core/navigation/AppNavigator';
import { requestNotificationPermission, setupNotificationListeners } from './app/core/notifications/notificationService';
import { Colors } from './app/core/theme/colors';

export default function App() {
  useEffect(() => {
    requestNotificationPermission();
    const cleanup = setupNotificationListeners(
      (notification) => console.log('Notificación recibida:', notification.request.content.title),
      (response) => console.log('Tapped:', response.notification.request.content.data)
    );
    return cleanup;
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      <AppNavigator />
    </>
  );
}
