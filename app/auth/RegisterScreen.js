// app/auth/RegisterScreen.js
// Pantalla de registro con validaciones de seguridad

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../constants/colors';
import { registerUser } from '../services/authService';
import { useTranslation } from '../i18n/useTranslation';

const RegisterScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
    birthDate: new Date(2000, 0, 1), gender: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Paso 1: datos, Paso 2: contraseña

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const validateStep1 = () => {
    if (!form.fullName.trim()) return 'Ingresa tu nombre completo';
    if (!form.email.includes('@')) return 'Ingresa un correo válido';
    if (!form.phone || form.phone.length < 10) return 'Ingresa un teléfono válido (10 dígitos)';
    if (!form.gender) return 'Selecciona tu sexo';

    const age = new Date().getFullYear() - form.birthDate.getFullYear();
    if (age < 6) return 'Debes tener al menos 6 años para usar la app';

    return null;
  };

  const validateStep2 = () => {
    if (form.password.length < 8) return t('auth.passwordMinLength');
    if (!/[A-Z]/.test(form.password)) return t('auth.passwordUppercase');
    if (!/[0-9]/.test(form.password)) return t('auth.passwordNumber');
    if (form.password !== form.confirmPassword) return 'Las contraseñas no coinciden';
    return null;
  };

  const handleNext = () => {
    const error = validateStep1();
    if (error) { Alert.alert(t('common.error'), error); return; }
    setStep(2);
  };

  const handleRegister = async () => {
    const error = validateStep2();
    if (error) { Alert.alert(t('common.error'), error); return; }

    setLoading(true);
    const result = await registerUser({
      email: form.email.toLowerCase().trim(),
      password: form.password,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      birthDate: form.birthDate.toISOString().split('T')[0],
      gender: form.gender,
    });
    setLoading(false);

    if (result.success) {
      navigation.navigate('VerifyEmail', { email: form.email });
    } else {
      Alert.alert(t('common.error'), result.error);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={Colors.gradientPrimary} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()}>
              <Ionicons name="arrow-back" size={28} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {step === 1 ? t('auth.register') : 'Crear Contraseña'}
            </Text>
            <Text style={styles.stepIndicator}>{step}/2</Text>
          </View>

          <View style={styles.form}>
            {step === 1 ? (
              <>
                {/* Paso 1: Datos personales */}
                <InputField icon="person-outline" placeholder={t('auth.fullName')} value={form.fullName} onChangeText={v => update('fullName', v)} />
                <InputField icon="mail-outline" placeholder={t('auth.email')} value={form.email} onChangeText={v => update('email', v)} keyboardType="email-address" />
                <InputField icon="call-outline" placeholder={t('auth.phone')} value={form.phone} onChangeText={v => update('phone', v)} keyboardType="phone-pad" />

                {/* Fecha de nacimiento */}
                <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                  <Text style={[styles.input, { color: Colors.textPrimary }]}>
                    {form.birthDate.toLocaleDateString('es-MX')}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={form.birthDate}
                    mode="date"
                    maximumDate={new Date()}
                    onChange={(_, date) => { setShowDatePicker(false); if (date) update('birthDate', date); }}
                  />
                )}

                {/* Género */}
                <Text style={styles.label}>{t('auth.gender')}</Text>
                <View style={styles.genderRow}>
                  {[{ key: 'male', label: t('auth.male'), icon: '👨' }, { key: 'female', label: t('auth.female'), icon: '👩' }].map(g => (
                    <TouchableOpacity
                      key={g.key}
                      style={[styles.genderBtn, form.gender === g.key && styles.genderBtnActive]}
                      onPress={() => update('gender', g.key)}
                    >
                      <Text style={styles.genderIcon}>{g.icon}</Text>
                      <Text style={[styles.genderText, form.gender === g.key && { color: Colors.white }]}>{g.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.button} onPress={handleNext}>
                  <Text style={styles.buttonText}>{t('common.next')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Paso 2: Contraseña */}
                <Text style={styles.securityNote}>🔒 Tu contraseña protege toda tu información personal</Text>

                <InputField
                  icon="lock-closed-outline" placeholder={t('auth.password')}
                  value={form.password} onChangeText={v => update('password', v)}
                  secureTextEntry={!showPassword}
                  rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                />
                <InputField
                  icon="lock-closed-outline" placeholder="Confirmar contraseña"
                  value={form.confirmPassword} onChangeText={v => update('confirmPassword', v)}
                  secureTextEntry
                />

                <View style={styles.passwordRules}>
                  {[
                    { rule: form.password.length >= 8, text: 'Mínimo 8 caracteres' },
                    { rule: /[A-Z]/.test(form.password), text: 'Una letra mayúscula' },
                    { rule: /[0-9]/.test(form.password), text: 'Un número' },
                  ].map((r, i) => (
                    <View key={i} style={styles.ruleRow}>
                      <Ionicons name={r.rule ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={r.rule ? Colors.success : Colors.textLight} />
                      <Text style={[styles.ruleText, r.rule && { color: Colors.success }]}>{r.text}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
                  <Text style={styles.buttonText}>{loading ? t('common.loading') : t('auth.register')}</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>{t('auth.alreadyHaveAccount')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

// Componente reutilizable para inputs
const InputField = ({ icon, rightIcon, onRightIconPress, ...props }) => (
  <View style={styles.inputWrapper}>
    <Ionicons name={icon} size={20} color={Colors.textSecondary} style={styles.inputIcon} />
    <TextInput style={styles.input} placeholderTextColor={Colors.textLight} autoCapitalize="none" {...props} />
    {rightIcon && (
      <TouchableOpacity onPress={onRightIconPress}>
        <Ionicons name={rightIcon} size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flexGrow: 1, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingTop: 40 },
  headerTitle: { color: Colors.white, fontSize: 20, fontWeight: 'bold' },
  stepIndicator: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  form: { backgroundColor: Colors.white, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryUltraLight, borderRadius: 12, marginBottom: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary },
  label: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8, marginTop: 4 },
  genderRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  genderBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, gap: 8 },
  genderBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  genderIcon: { fontSize: 20 },
  genderText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600' },
  button: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  loginLink: { color: Colors.primary, textAlign: 'center', fontSize: 14 },
  securityNote: { backgroundColor: Colors.primaryUltraLight, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: Colors.primary, textAlign: 'center' },
  passwordRules: { marginBottom: 16 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  ruleText: { fontSize: 13, color: Colors.textLight },
});

export default RegisterScreen;
