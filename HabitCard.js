// app/navigation/AppNavigator.js
// Configuración principal de navegación de la app

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

import { Colors } from '../constants/colors';
import { supabase } from '../services/supabase';
import { useTranslation } from '../i18n/useTranslation';

// Auth screens
import LoginScreen from '../auth/LoginScreen';
import RegisterScreen from '../auth/RegisterScreen';
import VerifyEmailScreen from '../auth/VerifyEmailScreen';

// Main screens
import HomeScreen from '../screens/HomeScreen';
import AssistantScreen from '../screens/AssistantScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import StoriesScreen from '../screens/StoriesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DevotionalScreen from '../screens/DevotionalScreen';
import WeeklyRecordScreen from '../screens/WeeklyRecordScreen';
import HabitDetailScreen from '../screens/HabitDetailScreen';
import PremiumScreen from '../screens/PremiumScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// === TABS PRINCIPALES ===
const MainTabs = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Assistant: focused ? 'sparkles' : 'sparkles-outline',
            Chat: focused ? 'chatbubbles' : 'chatbubbles-outline',
            Stories: focused ? 'images' : 'images-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name] || 'circle'} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('nav.home') }} />
      <Tab.Screen name="Assistant" component={AssistantScreen} options={{ title: t('nav.assistant') }} />
      <Tab.Screen name="Chat" component={ChatListScreen} options={{ title: t('nav.chat') }} />
      <Tab.Screen name="Stories" component={StoriesScreen} options={{ title: t('nav.stories') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('nav.profile') }} />
    </Tab.Navigator>
  );
};

// === STACK AUTH (Login/Registro) ===
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
  </Stack.Navigator>
);

// === STACK PRINCIPAL ===
const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
    <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
    <Stack.Screen name="HabitDetail" component={HabitDetailScreen} options={{ title: 'Hábito' }} />
    <Stack.Screen name="WeeklyRecord" component={WeeklyRecordScreen} options={{ title: 'Registro Semanal' }} />
    <Stack.Screen name="Devotional" component={DevotionalScreen} options={{ title: 'Devocional' }} />
    <Stack.Screen name="Premium" component={PremiumScreen} options={{ title: '⭐ Premium' }} />
  </Stack.Navigator>
);

// === NAVEGADOR RAÍZ ===
const AppNavigator = () => {
  const [session, setSession] = useState(undefined); // undefined = cargando

  useEffect(() => {
    // Verificar sesión al iniciar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Pantalla de carga
  if (session === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
