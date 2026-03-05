// app/auth/VerifyEmailScreen.js
// Pantalla para verificar el código enviado por correo

import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { supabase } from '../services/supabase';

const VerifyEmailScreen = ({ navigation, route }) => {
  const { email } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  const handleChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleVerify = async () => {
    const token = code.join('');
    if (token.length < 6) {
      Alert.alert('Error', 'Ingresa el código completo de 6 dígitos');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Código incorrecto o expirado. Revisa tu correo.');
    }
    // Si es correcto, el navegador detecta la sesión automáticamente
  };

  const resendCode = async () => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (!error) Alert.alert('✉️ Código reenviado', `Revisaste tu correo: ${email}`);
  };

  return (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✉️</Text>
        </View>
        <Text style={styles.title}>Verifica tu correo</Text>
        <Text style={styles.subtitle}>
          Enviamos un código de 6 dígitos a:{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => inputs.current[index] = ref}
              style={[styles.codeInput, digit && styles.codeInputFilled]}
              value={digit}
              onChangeText={text => handleChange(text.slice(-1), index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Verificando...' : 'Verificar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={resendCode} style={styles.resendBtn}>
          <Text style={styles.resendText}>¿No llegó el código? Reenviar</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  iconContainer: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  icon: { fontSize: 40 },
  title: { fontSize: 26, fontWeight: 'bold', color: Colors.white, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22, marginBottom: 36 },
  email: { fontWeight: 'bold', color: Colors.white },
  codeContainer: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  codeInput: { width: 48, height: 60, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', color: Colors.white, fontSize: 24, fontWeight: 'bold', textAlign: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  codeInputFilled: { backgroundColor: 'rgba(255,255,255,0.3)', borderColor: Colors.white },
  button: { width: '100%', backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 16 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: Colors.primary, fontSize: 16, fontWeight: 'bold' },
  resendBtn: { padding: 8 },
  resendText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
});

export default VerifyEmailScreen;
