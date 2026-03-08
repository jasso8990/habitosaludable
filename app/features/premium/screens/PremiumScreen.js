// app/screens/PremiumScreen.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';

const FEATURES = [
  { icon: '🤖', title: 'Hábitos ilimitados', desc: 'Sin límite de metas (gratis = 3 máx.)' },
  { icon: '📊', title: 'Estadísticas avanzadas', desc: 'Gráficas detalladas de tu progreso' },
  { icon: '🏆', title: 'Certificados con IA', desc: 'Mensajes personalizados en cada logro' },
  { icon: '💬', title: 'Chat multimedia', desc: 'Fotos y audios sin límites' },
  { icon: '🔔', title: 'Notificaciones inteligentes', desc: 'Recordatorios adaptativos' },
];

export default function PremiumScreen() {
  const handleSubscribe = (plan) => {
    Alert.alert('Próximamente', `El plan ${plan} estará disponible muy pronto. ¡Gracias por tu interés!`);
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={Colors.gradientPremium} style={styles.header}>
        <Text style={{ fontSize: 60, marginBottom: 12 }}>⭐</Text>
        <Text style={styles.headerTitle}>Hábitos Saludables Premium</Text>
        <Text style={styles.headerSub}>Desbloquea todo tu potencial</Text>
      </LinearGradient>

      <View style={styles.content}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.feature}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          </View>
        ))}

        <Text style={styles.plansTitle}>Elige tu plan</Text>
        {[
          { label: 'Mensual', price: '$4.99 USD/mes', popular: false },
          { label: 'Anual', price: '$39.99 USD/año', popular: true, savings: '¡Ahorra 33%!' },
        ].map((p, i) => (
          <TouchableOpacity key={i} style={[styles.planCard, p.popular && styles.planCardPop]} onPress={() => handleSubscribe(p.label)}>
            {p.popular && <Text style={styles.popBadge}>⭐ Más Popular</Text>}
            <Text style={styles.planLabel}>{p.label}</Text>
            <Text style={styles.planPrice}>{p.price}</Text>
            {p.savings && <Text style={styles.planSavings}>{p.savings}</Text>}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.cta} onPress={() => handleSubscribe('anual')}>
          <Text style={styles.ctaTxt}>🚀 Comenzar Premium</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>Cancela cuando quieras · Sin compromisos</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', padding: 40, paddingTop: 50 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.white, textAlign: 'center', marginBottom: 6 },
  headerSub: { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  content: { padding: 18 },
  feature: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 8, gap: 12 },
  featureIcon: { fontSize: 26 },
  featureInfo: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  featureDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  plansTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, textAlign: 'center', marginTop: 18, marginBottom: 12 },
  planCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 18, marginBottom: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center' },
  planCardPop: { borderColor: Colors.premium, backgroundColor: '#FFFEF2' },
  popBadge: { fontSize: 13, color: Colors.premiumDark, fontWeight: '600', marginBottom: 6 },
  planLabel: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  planPrice: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
  planSavings: { fontSize: 13, color: Colors.success, marginTop: 4 },
  cta: { backgroundColor: Colors.premium, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: 10 },
  ctaTxt: { color: Colors.white, fontSize: 17, fontWeight: 'bold' },
  disclaimer: { textAlign: 'center', fontSize: 12, color: Colors.textLight, marginBottom: 30 },
});
