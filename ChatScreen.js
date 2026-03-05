// app/components/HabitCard.js
// Tarjeta de hábito que muestra progreso y botón de completar

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const categoryEmojis = {
  salud: '💪', espiritual: '🙏', relaciones: '🤝',
  estudio: '📚', ejercicio: '🏃', otro: '⭐',
  health: '💪', spiritual: '🙏', relationships: '🤝',
  study: '📚', exercise: '🏃', other: '⭐',
};

const HabitCard = ({ habit, isCompleted, onComplete, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.card, isCompleted && styles.cardCompleted]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.row}>
        {/* Emoji de categoría */}
        <View style={[styles.categoryBadge, isCompleted && styles.categoryBadgeCompleted]}>
          <Text style={styles.categoryEmoji}>
            {categoryEmojis[habit.category] || '⭐'}
          </Text>
        </View>

        {/* Información del hábito */}
        <View style={styles.info}>
          <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
            {habit.title}
          </Text>
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={12} color={Colors.textLight} />
            <Text style={styles.metaText}>{habit.reminder_time}</Text>
            <Text style={styles.dot}>•</Text>
            <Ionicons name="flame-outline" size={12} color={Colors.accent} />
            <Text style={styles.streakText}>{habit.streak} días</Text>
          </View>
        </View>

        {/* Botón de completar */}
        <TouchableOpacity
          style={[styles.checkButton, isCompleted && styles.checkButtonDone]}
          onPress={onComplete}
        >
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
            size={32}
            color={isCompleted ? Colors.success : Colors.border}
          />
        </TouchableOpacity>
      </View>

      {/* Barra de racha */}
      {habit.streak > 0 && (
        <View style={styles.streakBar}>
          <View style={[styles.streakFill, { width: `${Math.min(habit.streak * 10, 100)}%` }]} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryLight,
  },
  cardCompleted: {
    borderLeftColor: Colors.success,
    backgroundColor: '#F0FFF4',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  categoryBadge: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.primaryUltraLight,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  categoryBadgeCompleted: { backgroundColor: '#DCFCE7' },
  categoryEmoji: { fontSize: 24 },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  titleCompleted: { color: Colors.textSecondary, textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textLight },
  dot: { fontSize: 12, color: Colors.textLight },
  streakText: { fontSize: 12, color: Colors.accent, fontWeight: '600' },
  checkButton: { padding: 4 },
  checkButtonDone: {},
  streakBar: {
    height: 3, backgroundColor: Colors.divider, borderRadius: 2,
    marginTop: 10, overflow: 'hidden',
  },
  streakFill: {
    height: '100%', backgroundColor: Colors.accent, borderRadius: 2,
  },
});

export default HabitCard;
