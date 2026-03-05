// app/auth/LoginScreen.js
// Pantalla de inicio de sesión

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { loginUser } from '../services/authService';
import { useTranslation } from '../i18n/useTranslation';

const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), 'Por favor llena todos los campos');
      return;
    }

    setLoading(true);
    const result = await loginUser({ email, password });
    setLoading(false);

    if (!result.success) {
      Alert.alert(t('common.error'), result.error);
    }
    // Si tiene éxito, el navigator detecta la sesión automáticamente
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={Colors.gradientPrimary} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🌱</Text>
            <Text style={styles.appName}>Hábitos Saludables</Text>
            <Text style={styles.tagline}>Transforma tu vida, un hábito a la vez</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>{t('auth.login')}</Text>

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.email')}
                placeholderTextColor={Colors.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.password')}
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? t('common.loading') : t('auth.login')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerText}>{t('auth.noAccount')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoIcon: { fontSize: 64, marginBottom: 12 },
  appName: { fontSize: 28, fontWeight: 'bold', color: Colors.white, marginBottom: 6 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  form: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  formTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 24, textAlign: 'center' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary },
  eyeIcon: { padding: 4 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: Colors.primary, fontSize: 13 },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  registerLink: { alignItems: 'center' },
  registerText: { color: Colors.primary, fontSize: 14 },
});

export default LoginScreen;
