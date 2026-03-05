// app/screens/WeeklyRecordScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { getWeeklyProgress } from '../services/habitService';
import { generateCertificateMessage } from '../services/aiService';
import { supabase } from '../services/supabase';

const WeeklyRecordScreen = () => {
  const [weeklyData, setWeeklyData] = useState({ percentage: 0, completedHabits: 0, totalHabits: 0 });
  const [certificateMsg, setCertificateMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const result = await getWeeklyProgress(user.id);
      if (result.success) {
        setWeeklyData(result);
        if (result.percentage >= 80) {
          const cert = await generateCertificateMessage(result.percentage, 'tus hábitos', 'esta semana');
          if (cert.success) setCertificateMsg(cert.message);
        }
      }
    };
    load();
  }, []);

  const shareAchievement = async () => {
    await Share.share({
      message: `🌱 ¡Completé el ${weeklyData.percentage}% de mis metas esta semana con Hábitos Saludables! 💪 ${certificateMsg}`,
    });
  };

  const getProgressColor = (pct) => {
    if (pct >= 80) return Colors.success;
    if (pct >= 50) return Colors.accent;
    return Colors.primary;
  };

  const progressColor = getProgressColor(weeklyData.percentage);

  return (
    <ScrollView style={styles.container}>
      {/* Progreso principal */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>📊 Esta Semana</Text>
        <View style={styles.circleContainer}>
          <View style={[styles.circle, { borderColor: progressColor }]}>
            <Text style={[styles.circlePercent, { color: progressColor }]}>{weeklyData.percentage}%</Text>
            <Text style={styles.circleLabel}>completado</Text>
          </View>
        </View>
        <Text style={styles.statsText}>
          {weeklyData.completedHabits} de {weeklyData.totalHabits} hábitos completados
        </Text>
      </View>

      {/* Certificado si supera 80% */}
      {weeklyData.percentage >= 80 && (
        <View style={[styles.certificateCard, { borderColor: progressColor }]}>
          <Text style={styles.certIcon}>🏆</Text>
          <Text style={styles.certTitle}>¡Felicidades!</Text>
          <Text style={styles.certMsg}>{certificateMsg || `Completaste el ${weeklyData.percentage}% de tus metas. ¡Sigue así!`}</Text>
          <TouchableOpacity style={[styles.shareBtn, { backgroundColor: progressColor }]} onPress={shareAchievement}>
            <Ionicons name="share-outline" size={18} color={Colors.white} />
            <Text style={styles.shareBtnText}>Compartir logro</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mensaje motivador si no alcanzó 80% */}
      {weeklyData.percentage < 80 && weeklyData.totalHabits > 0 && (
        <View style={styles.motivationCard}>
          <Text style={styles.motivationIcon}>💪</Text>
          <Text style={styles.motivationText}>
            {weeklyData.percentage === 0
              ? '¡Empieza hoy! Cada gran logro comienza con un pequeño paso.'
              : '¡Buen esfuerzo! La próxima semana puedes llegar al 80% para obtener tu certificado.'
            }
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressCard: { margin: 16, backgroundColor: Colors.white, borderRadius: 24, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  progressTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 20 },
  circleContainer: { marginBottom: 16 },
  circle: { width: 150, height: 150, borderRadius: 75, borderWidth: 10, justifyContent: 'center', alignItems: 'center' },
  circlePercent: { fontSize: 36, fontWeight: 'bold' },
  circleLabel: { fontSize: 13, color: Colors.textSecondary },
  statsText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  certificateCard: { marginHorizontal: 16, backgroundColor: Colors.white, borderRadius: 20, padding: 24, borderWidth: 2, alignItems: 'center', marginBottom: 16 },
  certIcon: { fontSize: 48, marginBottom: 12 },
  certTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 8 },
  certMsg: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20 },
  shareBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 15 },
  motivationCard: { marginHorizontal: 16, backgroundColor: Colors.primaryUltraLight, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  motivationIcon: { fontSize: 32 },
  motivationText: { flex: 1, fontSize: 15, color: Colors.primary, lineHeight: 22 },
});

export default WeeklyRecordScreen;
