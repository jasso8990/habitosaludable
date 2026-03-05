// app/screens/WeeklyRecordScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { supabase } from '../services/supabase';
import { getWeeklyProgress } from '../services/habitService';
import { generateCertificateMessage } from '../services/aiService';
import { sendAchievementNotification } from '../services/notificationService';

export default function WeeklyRecordScreen() {
  const [data, setData] = useState({ percentage: 0, completedHabits: 0, totalHabits: 0 });
  const [certMsg, setCertMsg] = useState('');
  const [sharedToStory, setSharedToStory] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const r = await getWeeklyProgress(user.id);
      setData(r);
      if (r.percentage >= 80) {
        const c = await generateCertificateMessage(r.percentage, 'tus hábitos', 'esta semana');
        if (c.success) { setCertMsg(c.message); sendAchievementNotification(c.message); }
      }
    };
    load();
  }, []);

  const shareAchievement = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await Share.share({ message: `🌱 ¡Completé el ${data.percentage}% de mis hábitos esta semana!\n\n${certMsg}\n\n#HábitosSaludables` });
    // Guardar en historias
    if (user && !sharedToStory) {
      await supabase.from('stories').insert({
        user_id: user.id, type: 'weekly', percentage: data.percentage,
        title: `¡${data.percentage}% completado esta semana!`, message: certMsg || `Completé el ${data.percentage}% de mis metas semanales.`,
      });
      setSharedToStory(true);
      Alert.alert('🏆 Logro compartido', 'Tu logro apareció en las historias');
    }
  };

  const c = data.percentage >= 80 ? Colors.success : data.percentage >= 50 ? Colors.accent : Colors.primary;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.circleCard}>
        <Text style={styles.circleTitle}>📊 Esta Semana</Text>
        <View style={[styles.circle, { borderColor: c }]}>
          <Text style={[styles.circlePct, { color: c }]}>{data.percentage}%</Text>
          <Text style={styles.circleLabel}>completado</Text>
        </View>
        <Text style={styles.circleStats}>{data.completedHabits} de {data.totalHabits} hábitos</Text>
      </View>

      {data.percentage >= 80 ? (
        <View style={[styles.certCard, { borderColor: c }]}>
          <Text style={styles.certIcon}>🏆</Text>
          <Text style={styles.certTitle}>¡Felicidades!</Text>
          <Text style={styles.certMsg}>{certMsg || `¡Completaste el ${data.percentage}% de tus metas! ¡Sigue así!`}</Text>
          <TouchableOpacity style={[styles.shareBtn, { backgroundColor: c }]} onPress={shareAchievement}>
            <Ionicons name="share-outline" size={17} color={Colors.white} />
            <Text style={styles.shareBtnTxt}>{sharedToStory ? 'Compartir de nuevo' : 'Compartir logro'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.motivCard}>
          <Text style={{ fontSize: 30 }}>💪</Text>
          <Text style={styles.motivTxt}>
            {data.percentage === 0 ? '¡Empieza hoy! Cada gran logro comienza con un pequeño paso.'
              : `¡Buen intento! Necesitas llegar al 80% para obtener tu certificado. ¡Tú puedes!`}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const s1 = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  circleCard: { margin: 16, backgroundColor: Colors.white, borderRadius: 22, padding: 26, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3 },
  circleTitle: { fontSize: 17, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 18 },
  circle: { width: 148, height: 148, borderRadius: 74, borderWidth: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  circlePct: { fontSize: 36, fontWeight: 'bold' },
  circleLabel: { fontSize: 13, color: Colors.textSecondary },
  circleStats: { fontSize: 14, color: Colors.textSecondary },
  certCard: { marginHorizontal: 16, backgroundColor: Colors.white, borderRadius: 20, padding: 22, borderWidth: 2, alignItems: 'center', marginBottom: 14 },
  certIcon: { fontSize: 46, marginBottom: 10 },
  certTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 8 },
  certMsg: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 18 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 20 },
  shareBtnTxt: { color: Colors.white, fontWeight: 'bold', fontSize: 14 },
  motivCard: { marginHorizontal: 16, backgroundColor: Colors.primaryUltraLight, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  motivTxt: { flex: 1, fontSize: 14, color: Colors.primary, lineHeight: 21 },
});
// Exportamos también los estilos para reutilizar arriba
const styles = s1;
