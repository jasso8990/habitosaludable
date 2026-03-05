// app/components/HabitCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const EMOJIS = { salud: '💪', espiritual: '🙏', relaciones: '🤝', estudio: '📚', ejercicio: '🏃', otro: '⭐' };

export default function HabitCard({ habit, isCompleted, onComplete, onPress }) {
  return (
    <TouchableOpacity style={[styles.card, isCompleted && styles.cardDone]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.row}>
        <View style={[styles.emoji, isCompleted && styles.emojiDone]}>
          <Text style={styles.emojiText}>{EMOJIS[habit.category] || '⭐'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, isCompleted && styles.titleDone]}>{habit.title}</Text>
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={12} color={Colors.textLight} />
            <Text style={styles.metaText}>{habit.reminder_time}</Text>
            <Text style={styles.dot}>·</Text>
            <Ionicons name="flame-outline" size={12} color={Colors.accent} />
            <Text style={styles.streak}>{habit.streak} días</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onComplete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name={isCompleted ? 'checkmark-circle' : 'radio-button-off'} size={34} color={isCompleted ? Colors.success : Colors.border} />
        </TouchableOpacity>
      </View>
      {habit.streak > 0 && (
        <View style={styles.streakBar}>
          <View style={[styles.streakFill, { width: `${Math.min(habit.streak * 5, 100)}%` }]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: Colors.primaryLight, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardDone: { borderLeftColor: Colors.success, backgroundColor: '#F0FFF6' },
  row: { flexDirection: 'row', alignItems: 'center' },
  emoji: { width: 46, height: 46, borderRadius: 13, backgroundColor: Colors.primaryUltraLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  emojiDone: { backgroundColor: '#DCFCE7' },
  emojiText: { fontSize: 22 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 3 },
  titleDone: { color: Colors.textSecondary, textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textLight },
  dot: { fontSize: 12, color: Colors.textLight },
  streak: { fontSize: 12, color: Colors.accent, fontWeight: '600' },
  streakBar: { height: 3, backgroundColor: Colors.divider, borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  streakFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
});
