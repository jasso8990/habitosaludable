import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './app/navigation/AppNavigator';
import { requestNotificationPermission, setupNotificationListeners } from './app/services/notificationService';
import { Colors } from './app/constants/colors';

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
