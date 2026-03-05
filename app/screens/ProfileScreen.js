// app/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { supabase } from '../services/supabase';
import { logoutUser } from '../services/authService';
import { setLanguage, useTranslation } from '../i18n/useTranslation';

const ProfileScreen = ({ navigation }) => {
  const { t, language } = useTranslation();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    };
    load();
  }, []);

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar Sesión', style: 'destructive', onPress: () => logoutUser() },
    ]);
  };

  const menuItems = [
    { icon: 'star-outline', label: '⭐ Actualizar a Premium', color: Colors.premium, onPress: () => navigation.navigate('Premium') },
    { icon: 'bar-chart-outline', label: 'Registro Semanal', onPress: () => navigation.navigate('WeeklyRecord') },
    { icon: 'book-outline', label: 'Devocional', onPress: () => navigation.navigate('Devotional') },
    { icon: 'language-outline', label: `Idioma: ${language === 'es' ? '🇲🇽 Español' : '🇺🇸 English'}`, onPress: () => setLanguage(language === 'es' ? 'en' : 'es') },
    { icon: 'notifications-outline', label: 'Notificaciones', onPress: () => {} },
    { icon: 'shield-outline', label: 'Privacidad y Seguridad', onPress: () => {} },
    { icon: 'log-out-outline', label: 'Cerrar Sesión', color: Colors.error, onPress: handleLogout },
  ];

  const age = profile?.birth_date ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear() : '?';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.full_name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{profile?.full_name || 'Cargando...'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <View style={styles.badges}>
          {profile?.is_premium && <View style={styles.premiumBadge}><Text style={styles.premiumBadgeText}>⭐ Premium</Text></View>}
          <View style={styles.ageBadge}><Text style={styles.ageBadgeText}>{age} años</Text></View>
        </View>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem} onPress={item.onPress}>
            <Ionicons name={item.icon} size={22} color={item.color || Colors.primary} />
            <Text style={[styles.menuLabel, item.color && { color: item.color }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.version}>Hábitos Saludables v1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: Colors.white },
  name: { fontSize: 22, fontWeight: 'bold', color: Colors.white, marginBottom: 4 },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 8 },
  premiumBadge: { backgroundColor: Colors.premium, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  premiumBadgeText: { color: Colors.white, fontWeight: '600', fontSize: 13 },
  ageBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  ageBadgeText: { color: Colors.white, fontSize: 13 },
  menu: { margin: 16, backgroundColor: Colors.white, borderRadius: 20, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  version: { textAlign: 'center', color: Colors.textLight, fontSize: 13, marginBottom: 40 },
});

export default ProfileScreen;
