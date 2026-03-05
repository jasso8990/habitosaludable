// app/auth/VerifyEmailScreen.js
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { supabase } from '../services/supabase';

export default function VerifyEmailScreen({ route }) {
  const { email } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const refs = useRef([]);

  const handleChange = (text, i) => {
    const next = [...code];
    next[i] = text;
    setCode(next);
    if (text && i < 5) refs.current[i + 1]?.focus();
  };

  const verify = async () => {
    const token = code.join('');
    if (token.length < 6) { Alert.alert('Error', 'Ingresa el código de 6 dígitos'); return; }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    setLoading(false);
    if (error) Alert.alert('Error', 'Código incorrecto o expirado.');
  };

  const resend = async () => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    Alert.alert(!error ? '✉️ Reenviado' : 'Error', !error ? 'Revisa tu correo: ' + email : error.message);
  };

  return (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.bg}>
      <View style={styles.container}>
        <Text style={styles.icon}>✉️</Text>
        <Text style={styles.title}>Verifica tu correo</Text>
        <Text style={styles.sub}>Código enviado a:{'\n'}<Text style={styles.email}>{email}</Text></Text>

        <View style={styles.codeRow}>
          {code.map((d, i) => (
            <TextInput key={i} ref={r => refs.current[i] = r}
              style={[styles.box, d && styles.boxFilled]}
              value={d} onChangeText={t => handleChange(t.slice(-1), i)}
              keyboardType="number-pad" maxLength={1} selectTextOnFocus />
          ))}
        </View>

        <TouchableOpacity style={[styles.btn, loading && styles.btnOff]} onPress={verify} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Verificando...' : 'Verificar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={resend}>
          <Text style={styles.resend}>¿No llegó? Reenviar código</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: Colors.white, marginBottom: 10, textAlign: 'center' },
  sub: { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  email: { fontWeight: 'bold', color: Colors.white },
  codeRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  box: { width: 48, height: 58, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', color: Colors.white, fontSize: 24, fontWeight: 'bold', textAlign: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  boxFilled: { backgroundColor: 'rgba(255,255,255,0.35)', borderColor: Colors.white },
  btn: { width: '100%', backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 14 },
  btnOff: { opacity: 0.6 },
  btnText: { color: Colors.primary, fontSize: 16, fontWeight: 'bold' },
  resend: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
});
