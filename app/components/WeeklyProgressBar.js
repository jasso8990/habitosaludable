// app/components/WeeklyProgressBar.js
// Barra de progreso semanal con días de la semana

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const WeeklyProgressBar = ({ percentage = 0 }) => {
  const getColor = () => {
    if (percentage >= 80) return Colors.success;
    if (percentage >= 50) return Colors.accent;
    return Colors.primary;
  };

  const getMessage = () => {
    if (percentage === 0) return '¡Empieza hoy! 💪';
    if (percentage < 50) return '¡Vas bien, sigue así!';
    if (percentage < 80) return '¡Excelente progreso! 🔥';
    return '¡Increíble semana! 🏆';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progreso Semanal</Text>
        <Text style={[styles.percentage, { color: getColor() }]}>{percentage}%</Text>
      </View>

      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: getColor() }]} />
      </View>

      <Text style={styles.message}>{getMessage()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  percentage: { fontSize: 20, fontWeight: 'bold' },
  barContainer: {
    height: 10, backgroundColor: Colors.divider, borderRadius: 5,
    overflow: 'hidden', marginBottom: 8,
  },
  barFill: { height: '100%', borderRadius: 5 },
  message: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});

export default WeeklyProgressBar;
