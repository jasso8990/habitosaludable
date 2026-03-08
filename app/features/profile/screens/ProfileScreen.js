// app/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { supabase } from '../../../core/supabase/client';
import { getUserProfile, logoutUser } from '../../auth/services/authService';
import { setLanguage, useTranslation } from '../../../core/i18n/useTranslation';
import { getUserLevel } from '../../levels/services/levelService';

export default function ProfileScreen({ navigation }) {
  const { t, language } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ habits: 0, completions: 0 });
  const [levelData, setLevelData] = useState({ level: 1, safePoints: 0, progressInLevel: 0, pointsToNextLevel: 100, insignias: [] });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { profile: p } = await getUserProfile(user.id).then(r => r.success ? r : { profile: null });
      setProfile(p);
      const [{ count: h }, { count: c }] = await Promise.all([
        supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true),
        supabase.from('habit_completions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      setStats({ habits: h || 0, completions: c || 0 });

      const levelResult = await getUserLevel(user.id);
      if (levelResult.success) setLevelData(levelResult.levelData);
    };
    load();
  }, []);

  const logout = () => Alert.alert('Cerrar Sesión', '¿Seguro que quieres salir?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Salir', style: 'destructive', onPress: () => logoutUser() },
  ]);

  const calcAge = (dob) => {
    if (!dob) return '?';
    return new Date().getFullYear() - new Date(dob).getFullYear();
  };

  const menuItems = [
    { icon: 'star-outline', label: '⭐ Actualizar a Premium', color: Colors.premium, action: () => navigation.navigate('Premium') },
    { icon: 'bar-chart-outline', label: 'Registro Semanal', action: () => navigation.navigate('WeeklyRecord') },
    { icon: 'book-outline', label: 'Devocional', action: () => navigation.navigate('Devotional') },
    { icon: 'language-outline', label: `Idioma: ${language === 'es' ? '🇲🇽 Español' : '🇺🇸 English'}`, action: () => setLanguage(language === 'es' ? 'en' : 'es') },
    { icon: 'shield-checkmark-outline', label: 'Privacidad: Tus datos están protegidos', action: () => Alert.alert('🔒 Privacidad', 'Todos tus datos están cifrados. Ni el administrador puede acceder a tu información personal.') },
    { icon: 'log-out-outline', label: 'Cerrar Sesión', color: Colors.error, action: logout },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{profile?.full_name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{profile?.full_name || '...'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <View style={styles.badges}>
          {profile?.is_premium && <View style={styles.premBadge}><Text style={styles.premTxt}>⭐ Premium</Text></View>}
          <View style={styles.ageBadge}><Text style={styles.ageTxt}>{calcAge(profile?.birth_date)} años · {profile?.gender === 'male' ? '👨' : profile?.gender === 'female' ? '👩' : '🧑'}</Text></View>
        </View>
      </View>

      <View style={styles.levelCard}>
        <View style={styles.levelTop}>
          <Text style={styles.levelTitle}>Nivel {levelData.level}</Text>
          <Text style={styles.levelPts}>{levelData.safePoints} pts</Text>
        </View>
        <View style={styles.levelBar}>
          <View style={[styles.levelBarFill, { width: `${Math.min(100, levelData.progressInLevel)}%` }]} />
        </View>
        <Text style={styles.levelHint}>Faltan {levelData.pointsToNextLevel} pts para el siguiente nivel</Text>
        {!!levelData.insignias?.length && (
          <View style={styles.badgesRow}>
            {levelData.insignias.slice(-3).map((b) => (
              <View key={b.id} style={styles.badgePill}>
                <Text style={styles.badgePillText}>🏅 {b.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { val: stats.habits, label: 'Hábitos activos' },
          { val: stats.completions, label: 'Total completados' },
        ].map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statVal}>{s.val}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {menuItems.map((m, i) => (
          <TouchableOpacity key={i} style={[styles.menuItem, i === menuItems.length - 1 && styles.menuItemLast]} onPress={m.action}>
            <Ionicons name={m.icon} size={20} color={m.color || Colors.primary} />
            <Text style={[styles.menuLabel, m.color && { color: m.color }]}>{m.label}</Text>
            <Ionicons name="chevron-forward" size={15} color={Colors.textLight} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.version}>Hábitos Saludables v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, alignItems: 'center', paddingTop: 36, paddingBottom: 30 },
  avatar: { width: 86, height: 86, borderRadius: 43, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)' },
  avatarTxt: { fontSize: 34, fontWeight: 'bold', color: Colors.white },
  name: { fontSize: 20, fontWeight: 'bold', color: Colors.white, marginBottom: 3 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  badges: { flexDirection: 'row', gap: 8 },
  premBadge: { backgroundColor: Colors.premium, paddingHorizontal: 11, paddingVertical: 4, borderRadius: 12 },
  premTxt: { color: Colors.white, fontWeight: 'bold', fontSize: 12 },
  ageBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 11, paddingVertical: 4, borderRadius: 12 },
  ageTxt: { color: Colors.white, fontSize: 12 },
  levelCard: { marginHorizontal: 16, marginTop: 14, backgroundColor: Colors.white, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  levelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
  levelPts: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  levelBar: { marginTop: 8, height: 8, borderRadius: 8, backgroundColor: Colors.divider, overflow: 'hidden' },
  levelBarFill: { height: '100%', backgroundColor: Colors.primary },
  levelHint: { marginTop: 8, fontSize: 12, color: Colors.textSecondary },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  badgePill: { backgroundColor: Colors.primaryUltraLight, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 8 },
  badgePillText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', margin: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statVal: { fontSize: 26, fontWeight: 'bold', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 3, textAlign: 'center' },
  menu: { marginHorizontal: 16, backgroundColor: Colors.white, borderRadius: 18, overflow: 'hidden', marginBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 14, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  menuItemLast: { borderBottomWidth: 0 },
  menuLabel: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  version: { textAlign: 'center', color: Colors.textLight, fontSize: 12, marginBottom: 36, marginTop: 8 },
});
