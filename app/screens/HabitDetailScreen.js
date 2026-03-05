// app/screens/HabitDetailScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { deleteHabit } from '../services/habitService';
import { cancelHabitReminder } from '../services/notificationService';

const HabitDetailScreen = ({ route, navigation }) => {
  const { habit } = route.params;

  const handleDelete = () => {
    Alert.alert('Eliminar Hábito', `¿Eliminar "${habit.title}"? Perderás tu racha.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await cancelHabitReminder(habit.notification_ids);
          await deleteHabit(habit.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const daysLabel = {
    daily: 'Todos los días',
    weekdays: 'Lunes a Viernes',
    custom: `Días: ${habit.days_of_week?.join(', ')}`,
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{habit.title}</Text>
        {habit.description ? <Text style={styles.description}>{habit.description}</Text> : null}

        <View style={styles.stats}>
          {[
            { icon: '🔥', label: 'Racha', value: `${habit.streak} días` },
            { icon: '✅', label: 'Completados', value: habit.total_completions },
            { icon: '⏰', label: 'Hora', value: habit.reminder_time },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
          <Text style={styles.infoText}>{daysLabel[habit.frequency] || 'Personalizado'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={18} color={Colors.error} />
        <Text style={styles.deleteBtnText}>Eliminar este hábito</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 24, padding: 24, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 8 },
  description: { fontSize: 15, color: Colors.textSecondary, marginBottom: 20 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.divider },
  statItem: { alignItems: 'center' },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: 15, color: Colors.textSecondary },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.error },
  deleteBtnText: { color: Colors.error, fontWeight: '600', fontSize: 15 },
});

export default HabitDetailScreen;
