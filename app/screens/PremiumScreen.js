// app/screens/PremiumScreen.js
// Pantalla para suscripción Premium

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const FEATURES = [
  { icon: '🤖', title: 'Hábitos ilimitados', desc: 'Crea tantas metas como quieras sin límites' },
  { icon: '📊', title: 'Estadísticas avanzadas', desc: 'Analiza tu progreso con gráficas detalladas' },
  { icon: '🏆', title: 'Certificados personalizados', desc: 'Certificados únicos para cada logro' },
  { icon: '💬', title: 'Chat multimedia', desc: 'Envía fotos y audios sin límites' },
  { icon: '🔔', title: 'Recordatorios premium', desc: 'Alertas inteligentes personalizadas' },
  { icon: '⭐', title: 'Soporte prioritario', desc: 'Atención personalizada 24/7' },
];

const PremiumScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#F1C40F', '#D4AC0D']} style={styles.header}>
        <Text style={styles.headerIcon}>⭐</Text>
        <Text style={styles.headerTitle}>Hábitos Saludables Premium</Text>
        <Text style={styles.headerSubtitle}>Desbloquea todo tu potencial</Text>
      </LinearGradient>

      <View style={styles.content}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
          </View>
        ))}

        <View style={styles.pricingContainer}>
          <Text style={styles.pricingTitle}>Elige tu plan</Text>
          {[
            { label: 'Mensual', price: '$4.99', period: '/mes', popular: false },
            { label: 'Anual', price: '$39.99', period: '/año', popular: true, savings: 'Ahorra 33%' },
          ].map((plan, i) => (
            <TouchableOpacity key={i} style={[styles.planCard, plan.popular && styles.planCardPopular]}>
              {plan.popular && <Text style={styles.popularBadge}>⭐ Más Popular</Text>}
              <Text style={styles.planLabel}>{plan.label}</Text>
              <Text style={styles.planPrice}>{plan.price}<Text style={styles.planPeriod}>{plan.period}</Text></Text>
              {plan.savings && <Text style={styles.planSavings}>{plan.savings}</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.ctaButton}>
          <Text style={styles.ctaText}>🚀 Comenzar Premium</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>Cancela cuando quieras. Sin compromisos.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', padding: 40, paddingTop: 60 },
  headerIcon: { fontSize: 64, marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.white, textAlign: 'center', marginBottom: 8 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  content: { padding: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 10, gap: 12 },
  featureIcon: { fontSize: 28 },
  featureInfo: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  featureDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  pricingContainer: { marginTop: 20 },
  pricingTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary, textAlign: 'center', marginBottom: 16 },
  planCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 2, borderColor: Colors.border, alignItems: 'center' },
  planCardPopular: { borderColor: Colors.premium, backgroundColor: '#FFFDF0' },
  popularBadge: { fontSize: 13, color: Colors.premiumDark, fontWeight: '600', marginBottom: 8 },
  planLabel: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  planPrice: { fontSize: 32, fontWeight: 'bold', color: Colors.primary },
  planPeriod: { fontSize: 16, fontWeight: 'normal', color: Colors.textSecondary },
  planSavings: { fontSize: 13, color: Colors.success, fontWeight: '600', marginTop: 4 },
  ctaButton: { backgroundColor: Colors.premium, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 12, shadowColor: Colors.premium, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  ctaText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
  disclaimer: { textAlign: 'center', fontSize: 13, color: Colors.textLight, marginBottom: 32 },
});

export default PremiumScreen;
