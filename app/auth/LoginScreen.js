// app/auth/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { loginUser, resetPassword } from '../services/authService';
import { useTranslation } from '../i18n/useTranslation';

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert(t('common.error'), 'Llena todos los campos'); return; }
    setLoading(true);
    const r = await loginUser({ email, password });
    setLoading(false);
    if (!r.success) Alert.alert(t('common.error'), r.error);
  };

  const handleForgot = async () => {
    if (!email) { Alert.alert('Ingresa tu correo primero'); return; }
    const r = await resetPassword(email);
    Alert.alert(r.success ? '✉️ Enviado' : t('common.error'), r.success ? 'Revisa tu correo para restablecer tu contraseña' : r.error);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={Colors.gradientPrimary} style={styles.bg}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.logo}>
            <Text style={styles.logoIcon}>🌱</Text>
            <Text style={styles.appName}>Hábitos Saludables</Text>
            <Text style={styles.tagline}>Transforma tu vida, un hábito a la vez</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('auth.login')}</Text>

            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder={t('auth.email')} placeholderTextColor={Colors.textLight}
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder={t('auth.password')} placeholderTextColor={Colors.textLight}
                value={password} onChangeText={setPassword} secureTextEntry={!showPw} />
              <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleForgot} style={styles.forgot}>
              <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
              <Text style={styles.btnText}>{loading ? t('common.loading') : t('auth.login')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>{t('auth.noAccount')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { alignItems: 'center', marginBottom: 36 },
  logoIcon: { fontSize: 64, marginBottom: 10 },
  appName: { fontSize: 26, fontWeight: 'bold', color: Colors.white, marginBottom: 6 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  card: { backgroundColor: Colors.white, borderRadius: 24, padding: 26, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 22, textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryUltraLight, borderRadius: 12, marginBottom: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary },
  forgot: { alignSelf: 'flex-end', marginBottom: 18 },
  forgotText: { color: Colors.primary, fontSize: 13 },
  btn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 14 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  link: { color: Colors.primary, textAlign: 'center', fontSize: 14 },
});
