// app/navigation/AppNavigator.js
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { supabase } from '../supabase/client';
import { useTranslation } from '../i18n/useTranslation';

// Auth
import LoginScreen from '../../auth/LoginScreen';
import RegisterScreen from '../../auth/RegisterScreen';
import VerifyEmailScreen from '../../auth/VerifyEmailScreen';

// Screens
import HomeScreen from '../../features/home/screens/HomeScreen';
import AssistantScreen from '../../features/assistant/screens/AssistantScreen';
import ChatListScreen from '../../features/chat/screens/ChatListScreen';
import ChatScreen from '../../features/chat/screens/ChatScreen';
import StoriesScreen from '../../features/stories/screens/StoriesScreen';
import ProfileScreen from '../../features/profile/screens/ProfileScreen';
import DevotionalScreen from '../../features/devotional/screens/DevotionalScreen';
import WeeklyRecordScreen from '../../features/weekly/screens/WeeklyRecordScreen';
import HabitDetailScreen from '../../features/habits/screens/HabitDetailScreen';
import PremiumScreen from '../../features/premium/screens/PremiumScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TAB_ICONS = {
  Home: ['home', 'home-outline'],
  Assistant: ['sparkles', 'sparkles-outline'],
  Chat: ['chatbubbles', 'chatbubbles-outline'],
  Stories: ['images', 'images-outline'],
  Profile: ['person', 'person-outline'],
};

const MainTabs = () => {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = TAB_ICONS[route.name] || ['circle', 'circle-outline'];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: { backgroundColor: Colors.white, borderTopColor: Colors.border, height: 60, paddingBottom: 6, paddingTop: 4 },
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

const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
    <Stack.Screen name="Chat" component={ChatScreen} options={{ headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.white }} />
    <Stack.Screen name="HabitDetail" component={HabitDetailScreen} options={{ title: 'Detalle', headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.white }} />
    <Stack.Screen name="WeeklyRecord" component={WeeklyRecordScreen} options={{ title: 'Registro Semanal', headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.white }} />
    <Stack.Screen name="Devotional" component={DevotionalScreen} options={{ title: 'Devocional', headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.white }} />
    <Stack.Screen name="Premium" component={PremiumScreen} options={{ title: '⭐ Premium', headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.white }} />
  </Stack.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

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
