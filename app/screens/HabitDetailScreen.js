// app/screens/HabitDetailScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { deleteHabit } from '../services/habitService';
import { cancelHabitReminder } from '../services/notificationService';

export default function HabitDetailScreen({ route, navigation }) {
  const { habit } = route.params;
  const freq = { daily: 'Todos los días', weekdays: 'Lunes a Viernes', custom: 'Días personalizados' };

  const handleDelete = () => {
    Alert.alert('Eliminar hábito', `¿Eliminar "${habit.title}"? Perderás tu racha de ${habit.streak} días.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await cancelHabitReminder(habit.notification_ids);
        await deleteHabit(habit.id);
        navigation.goBack();
      }},
    ]);
  };

  const EMOJIS = { salud: '💪', espiritual: '🙏', relaciones: '🤝', estudio: '📚', ejercicio: '🏃', otro: '⭐' };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.top}>
          <Text style={styles.emoji}>{EMOJIS[habit.category] || '⭐'}</Text>
          <View style={styles.topInfo}>
            <Text style={styles.title}>{habit.title}</Text>
            {habit.description ? <Text style={styles.desc}>{habit.description}</Text> : null}
          </View>
        </View>

        <View style={styles.stats}>
          {[
            { icon: '🔥', label: 'Racha', val: `${habit.streak} días` },
            { icon: '✅', label: 'Total', val: habit.total_completions },
            { icon: '⏰', label: 'Hora', val: habit.reminder_time },
          ].map((s, i) => (
            <View key={i} style={styles.stat}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={17} color={Colors.primary} />
          <Text style={styles.infoTxt}>{freq[habit.frequency] || 'Personalizado'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={17} color={Colors.error} />
        <Text style={styles.deleteTxt}>Eliminar este hábito</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 22, padding: 22, marginBottom: 14 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 20 },
  emoji: { fontSize: 40 },
  topInfo: { flex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 4 },
  desc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.divider, marginBottom: 16 },
  stat: { alignItems: 'center' },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statVal: { fontSize: 17, fontWeight: 'bold', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTxt: { fontSize: 14, color: Colors.textSecondary },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 15, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.error },
  deleteTxt: { color: Colors.error, fontWeight: '600', fontSize: 14 },
});
