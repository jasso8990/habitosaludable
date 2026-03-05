// App.js
// Punto de entrada principal de la aplicación

import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, Platform } from 'react-native';
import AppNavigator from './app/navigation/AppNavigator';
import {
  setupNotificationListeners,
  requestNotificationPermission,
} from './app/services/notificationService';
import { Colors } from './app/constants/colors';

export default function App() {
  const notificationListener = useRef();

  useEffect(() => {
    // Solicitar permisos de notificación al iniciar
    requestNotificationPermission();

    // Configurar escucha de notificaciones
    const cleanup = setupNotificationListeners(
      (notification) => {
        // Notificación recibida mientras la app está abierta
        console.log('Notificación recibida:', notification);
      },
      (response) => {
        // Usuario tocó la notificación
        const data = response.notification.request.content.data;
        console.log('Usuario tocó notificación:', data);
        // Aquí puedes navegar a la pantalla del hábito
      }
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
