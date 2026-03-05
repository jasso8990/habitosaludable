// app/auth/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { registerUser } from '../services/authService';
import { useTranslation } from '../i18n/useTranslation';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '', birthDate: '', gender: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const pwRules = [
    { ok: form.password.length >= 8, text: 'Mínimo 8 caracteres' },
    { ok: /[A-Z]/.test(form.password), text: 'Una mayúscula' },
    { ok: /[0-9]/.test(form.password), text: 'Un número' },
  ];

  const next = () => {
    if (!form.fullName) { Alert.alert('Error', 'Ingresa tu nombre'); return; }
    if (!form.email.includes('@')) { Alert.alert('Error', 'Correo inválido'); return; }
    if (form.phone.length < 10) { Alert.alert('Error', 'Teléfono inválido'); return; }
    if (!form.birthDate) { Alert.alert('Error', 'Ingresa tu fecha de nacimiento (YYYY-MM-DD)'); return; }
    if (!form.gender) { Alert.alert('Error', 'Selecciona tu sexo'); return; }
    setStep(2);
  };

  const submit = async () => {
    if (!pwRules.every(r => r.ok)) { Alert.alert('Error', 'La contraseña no cumple los requisitos'); return; }
    if (form.password !== form.confirm) { Alert.alert('Error', 'Las contraseñas no coinciden'); return; }
    setLoading(true);
    const r = await registerUser({ email: form.email, password: form.password, fullName: form.fullName, phone: form.phone, birthDate: form.birthDate, gender: form.gender });
    setLoading(false);
    if (r.success) {
      if (r.needsVerification) navigation.navigate('VerifyEmail', { email: form.email });
    } else {
      Alert.alert('Error', r.error);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={Colors.gradientPrimary} style={styles.bg}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => step === 1 ? navigation.goBack() : setStep(1)}>
              <Ionicons name="arrow-back" size={26} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('auth.register')} ({step}/2)</Text>
            <View style={{ width: 26 }} />
          </View>

          <View style={styles.card}>
            {step === 1 ? (
              <>
                <Field icon="person-outline" placeholder={t('auth.fullName')} value={form.fullName} onChange={v => upd('fullName', v)} />
                <Field icon="mail-outline" placeholder={t('auth.email')} value={form.email} onChange={v => upd('email', v)} keyboardType="email-address" />
                <Field icon="call-outline" placeholder={t('auth.phone') + ' (10 dígitos)'} value={form.phone} onChange={v => upd('phone', v)} keyboardType="phone-pad" />
                <Field icon="calendar-outline" placeholder="Fecha nacimiento (2000-01-31)" value={form.birthDate} onChange={v => upd('birthDate', v)} />

                <Text style={styles.label}>{t('auth.gender')}</Text>
                <View style={styles.genderRow}>
                  {[{ k: 'male', label: '👨 ' + t('auth.male') }, { k: 'female', label: '👩 ' + t('auth.female') }].map(g => (
                    <TouchableOpacity key={g.k} style={[styles.genderBtn, form.gender === g.k && styles.genderActive]}
                      onPress={() => upd('gender', g.k)}>
                      <Text style={[styles.genderText, form.gender === g.k && { color: Colors.white }]}>{g.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.btn} onPress={next}>
                  <Text style={styles.btnText}>{t('common.next')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.secNote}>🔒 Tu contraseña protege toda tu información</Text>
                <Field icon="lock-closed-outline" placeholder={t('auth.password')} value={form.password} onChange={v => upd('password', v)}
                  secureTextEntry={!showPw} rightIcon={showPw ? 'eye-off-outline' : 'eye-outline'} onRightPress={() => setShowPw(!showPw)} />
                <Field icon="lock-closed-outline" placeholder="Confirmar contraseña" value={form.confirm} onChange={v => upd('confirm', v)} secureTextEntry />

                <View style={styles.rules}>
                  {pwRules.map((r, i) => (
                    <View key={i} style={styles.ruleRow}>
                      <Ionicons name={r.ok ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={r.ok ? Colors.success : Colors.textLight} />
                      <Text style={[styles.ruleText, r.ok && { color: Colors.success }]}>{r.text}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={submit} disabled={loading}>
                  <Text style={styles.btnText}>{loading ? t('common.loading') : t('auth.register')}</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>{t('auth.alreadyHaveAccount')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const Field = ({ icon, rightIcon, onRightPress, onChange, ...props }) => (
  <View style={styles.inputRow}>
    <Ionicons name={icon} size={20} color={Colors.textSecondary} style={styles.inputIcon} />
    <TextInput style={styles.input} placeholderTextColor={Colors.textLight} autoCapitalize="none" onChangeText={onChange} {...props} />
    {rightIcon && <TouchableOpacity onPress={onRightPress}><Ionicons name={rightIcon} size={20} color={Colors.textSecondary} /></TouchableOpacity>}
  </View>
);

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flexGrow: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 44, paddingBottom: 20 },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
  card: { backgroundColor: Colors.white, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryUltraLight, borderRadius: 12, marginBottom: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: Colors.textPrimary },
  label: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  genderBtn: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 2, borderColor: Colors.border },
  genderActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  genderText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  btn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6, marginBottom: 14 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  link: { color: Colors.primary, textAlign: 'center', fontSize: 14 },
  secNote: { backgroundColor: Colors.primaryUltraLight, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 13, color: Colors.primary, textAlign: 'center' },
  rules: { marginBottom: 14 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  ruleText: { fontSize: 13, color: Colors.textLight },
});
