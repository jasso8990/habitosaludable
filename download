// app/screens/HomeScreen.js
// Pantalla principal con hábitos del día y progreso semanal

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { getUserHabits, completeHabit, getWeeklyProgress } from '../services/habitService';
import { getUserProfile } from '../services/authService';
import { supabase } from '../services/supabase';
import { useTranslation } from '../i18n/useTranslation';
import HabitCard from '../components/HabitCard';
import WeeklyProgressBar from '../components/WeeklyProgressBar';

const HomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [habits, setHabits] = useState([]);
  const [weeklyData, setWeeklyData] = useState({ percentage: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [todayCompletions, setTodayCompletions] = useState(new Set());

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting');
    if (hour < 18) return t('home.greetingAfternoon');
    return t('home.greetingEvening');
  };

  const loadData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const [profileResult, habitsResult, weeklyResult] = await Promise.all([
      getUserProfile(authUser.id),
      getUserHabits(authUser.id),
      getWeeklyProgress(authUser.id),
    ]);

    if (profileResult.success) setUser(profileResult.profile);
    if (habitsResult.success) {
      setHabits(habitsResult.habits);
    }
    if (weeklyResult.success) setWeeklyData(weeklyResult);

    // Obtener completaciones de hoy
    const today = new Date().toISOString().split('T')[0];
    const { data: completions } = await supabase
      .from('habit_completions')
      .select('habit_id')
      .eq('user_id', authUser.id)
      .eq('date', today);

    if (completions) {
      setTodayCompletions(new Set(completions.map(c => c.habit_id)));
    }
  };

  useFocusEffect(
    useCallback(() => { loadData(); }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCompleteHabit = async (habit) => {
    if (todayCompletions.has(habit.id)) {
      Alert.alert('✅ Ya completado', 'Ya marcaste este hábito hoy. ¡Excelente!');
      return;
    }

    const { data: { user: authUser } } = await supabase.auth.getUser();
    const result = await completeHabit(authUser.id, habit.id);

    if (result.success) {
      setTodayCompletions(prev => new Set([...prev, habit.id]));
      Alert.alert('🎉 ¡Bien hecho!', `Completaste: ${habit.title}`);
    }
  };

  const todayHabits = habits.filter(habit => {
    const today = new Date().getDay(); // 0=domingo
    const dayMap = { 0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
    const todayNum = dayMap[today];

    if (habit.frequency === 'daily') return true;
    if (habit.frequency === 'weekdays') return todayNum >= 1 && todayNum <= 5;
    if (habit.frequency === 'custom') return habit.days_of_week?.includes(todayNum);
    return true;
  });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header con saludo */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.full_name?.split(' ')[0] || 'Amigo'} 👋</Text>
        </View>
        <TouchableOpacity style={styles.weeklyBtn} onPress={() => navigation.navigate('WeeklyRecord')}>
          <Ionicons name="bar-chart-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Barra de progreso semanal */}
      <WeeklyProgressBar percentage={weeklyData.percentage} />

      {/* Botones rápidos */}
      <View style={styles.quickActions}>
        {[
          { icon: '📖', label: 'Devocional', screen: 'Devotional' },
          { icon: '🤖', label: t('nav.assistant'), screen: 'Assistant', tab: true },
          { icon: '📊', label: 'Registro', screen: 'WeeklyRecord' },
        ].map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.quickBtn}
            onPress={() => navigation.navigate(action.screen)}
          >
            <Text style={styles.quickIcon}>{action.icon}</Text>
            <Text style={styles.quickLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Hábitos de hoy */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.todayHabits')}</Text>
          <Text style={styles.sectionCount}>{todayCompletions.size}/{todayHabits.length}</Text>
        </View>

        {todayHabits.length === 0 ? (
          <TouchableOpacity style={styles.emptyCard} onPress={() => navigation.navigate('Assistant')}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyText}>{t('home.noHabitsYet')}</Text>
            <Text style={styles.emptyAction}>{t('home.createNewHabit')}</Text>
          </TouchableOpacity>
        ) : (
          todayHabits.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              isCompleted={todayCompletions.has(habit.id)}
              onComplete={() => handleCompleteHabit(habit)}
              onPress={() => navigation.navigate('HabitDetail', { habit })}
            />
          ))
        )}
      </View>

      {/* Espacio al final */}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  greeting: { fontSize: 16, color: Colors.textSecondary },
  userName: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary },
  weeklyBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryUltraLight, justifyContent: 'center', alignItems: 'center' },
  quickActions: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  quickBtn: { flex: 1, backgroundColor: Colors.white, borderRadius: 16, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  quickIcon: { fontSize: 24, marginBottom: 6 },
  quickLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  section: { paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  sectionCount: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', marginBottom: 8 },
  emptyAction: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
});

export default HomeScreen;
