// app/screens/HomeScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { supabase } from '../../../core/supabase/client';
import { getUserHabits, getTodayHabits, completeHabit, getTodayCompletions, getWeeklyProgress } from '../../habits/services/habitService';
import { getUserProfile } from '../../auth/services/authService';
import { useTranslation } from '../../../core/i18n/useTranslation';
import HabitCard from '../../habits/components/HabitCard';

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState(new Set());
  const [weekly, setWeekly] = useState({ percentage: 0, completedHabits: 0, totalHabits: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('home.greeting');
    if (h < 18) return t('home.greetingAfternoon');
    return t('home.greetingEvening');
  };

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const [pr, hr, cr, wr] = await Promise.all([
      getUserProfile(user.id),
      getUserHabits(user.id),
      getTodayCompletions(user.id),
      getWeeklyProgress(user.id),
    ]);
    if (pr.success) setProfile(pr.profile);
    if (hr.success) setHabits(hr.habits);
    setCompletions(cr);
    setWeekly(wr);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleComplete = async (habit) => {
    if (completions.has(habit.id)) { Alert.alert('✅ Ya completado', '¡Excelente, ya lo hiciste hoy!'); return; }
    const r = await completeHabit(userId, habit.id);
    if (r.success) {
      setCompletions(prev => new Set([...prev, habit.id]));
      Alert.alert('🎉 ¡Bien hecho!', `Completaste: ${habit.title}`);
    }
  };

  const todayHabits = getTodayHabits(habits);
  const pct = weekly.percentage;
  const pctColor = pct >= 80 ? Colors.success : pct >= 50 ? Colors.accent : Colors.primary;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.name}>{profile?.full_name?.split(' ')[0] || 'Amigo'} 👋</Text>
        </View>
        {profile?.is_premium && <View style={styles.premiumBadge}><Text style={styles.premiumText}>⭐ Premium</Text></View>}
      </View>

      {/* Progreso semanal */}
      <View style={styles.progressCard}>
        <View style={styles.progressTop}>
          <Text style={styles.progressLabel}>Progreso semanal</Text>
          <Text style={[styles.progressPct, { color: pctColor }]}>{pct}%</Text>
        </View>
        <View style={styles.bar}><View style={[styles.barFill, { width: `${pct}%`, backgroundColor: pctColor }]} /></View>
        <Text style={styles.progressMsg}>
          {pct === 0 ? '¡Empieza hoy! 💪' : pct < 50 ? '¡Vas bien, sigue!' : pct < 80 ? '¡Excelente! 🔥' : '¡Semana increíble! 🏆'}
        </Text>
      </View>

      {/* Acciones rápidas */}
      <View style={styles.quickRow}>
        {[
          { icon: '📖', label: 'Devocional', screen: 'Devotional' },
          { icon: '📊', label: 'Registro', screen: 'WeeklyRecord' },
          { icon: '⭐', label: 'Premium', screen: 'Premium' },
        ].map(a => (
          <TouchableOpacity key={a.label} style={styles.quickBtn} onPress={() => navigation.navigate(a.screen)}>
            <Text style={styles.quickIcon}>{a.icon}</Text>
            <Text style={styles.quickLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Hábitos de hoy */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{t('home.todayHabits')}</Text>
          <Text style={styles.sectionCount}>{completions.size}/{todayHabits.length}</Text>
        </View>

        {todayHabits.length === 0 ? (
          <TouchableOpacity style={styles.empty} onPress={() => navigation.navigate('Assistant')}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyText}>{t('home.noHabitsYet')}</Text>
            <Text style={styles.emptyAction}>{t('home.createNewHabit')}</Text>
          </TouchableOpacity>
        ) : (
          todayHabits.map(h => (
            <HabitCard key={h.id} habit={h} isCompleted={completions.has(h.id)}
              onComplete={() => handleComplete(h)} onPress={() => navigation.navigate('HabitDetail', { habit: h })} />
          ))
        )}
      </View>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  greeting: { fontSize: 15, color: Colors.textSecondary },
  name: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary },
  premiumBadge: { backgroundColor: Colors.premium, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  premiumText: { color: Colors.white, fontWeight: 'bold', fontSize: 12 },
  progressCard: { margin: 16, backgroundColor: Colors.white, borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  progressPct: { fontSize: 22, fontWeight: 'bold' },
  bar: { height: 10, backgroundColor: Colors.divider, borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  barFill: { height: '100%', borderRadius: 5 },
  progressMsg: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  quickRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  quickBtn: { flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  quickIcon: { fontSize: 22, marginBottom: 4 },
  quickLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  section: { paddingHorizontal: 16 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 8 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: Colors.textPrimary },
  sectionCount: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  empty: { backgroundColor: Colors.white, borderRadius: 18, padding: 30, alignItems: 'center', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' },
  emptyIcon: { fontSize: 44, marginBottom: 10 },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 6 },
  emptyAction: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
});
