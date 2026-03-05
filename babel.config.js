// app/screens/DevotionalScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Colors } from '../constants/colors';
import { supabase } from '../services/supabase';

const DevotionalScreen = () => {
  const [devotional, setDevotional] = useState(null);
  const [note, setNote] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('devotionals').select('*').eq('date', today).single();
      if (data) setDevotional(data);
      else {
        // Devocional de ejemplo si no hay uno en la base de datos
        setDevotional({
          verse: '"Todo lo puedo en Cristo que me fortalece."',
          verse_reference: 'Filipenses 4:13',
          reflection: 'Cada día es una nueva oportunidad para crecer. Los hábitos que construyes hoy son los cimientos de quien serás mañana. Con fe y constancia, cada pequeño paso te acerca más a la persona que estás destinado a ser.',
        });
      }
    };
    load();
  }, []);

  const saveNote = async () => {
    if (!note.trim()) return;
    Alert.alert('✅ Nota guardada', 'Tu reflexión personal ha sido guardada.');
    setNote('');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.verseCard}>
        <Text style={styles.verseLabel}>📖 Versículo del Día</Text>
        <Text style={styles.verse}>{devotional?.verse || 'Cargando...'}</Text>
        <Text style={styles.verseRef}>{devotional?.verse_reference}</Text>
      </View>
      <View style={styles.reflectionCard}>
        <Text style={styles.reflectionTitle}>💭 Reflexión</Text>
        <Text style={styles.reflection}>{devotional?.reflection}</Text>
      </View>
      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>✍️ Mi nota personal</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Escribe tus pensamientos aquí..."
          placeholderTextColor={Colors.textLight}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={5}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={saveNote}>
          <Text style={styles.saveBtnText}>Guardar nota</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  verseCard: { margin: 16, backgroundColor: Colors.primary, borderRadius: 20, padding: 24 },
  verseLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 12 },
  verse: { fontSize: 20, fontStyle: 'italic', color: Colors.white, lineHeight: 30, marginBottom: 12 },
  verseRef: { color: Colors.primaryLight, fontSize: 14, fontWeight: '600', textAlign: 'right' },
  reflectionCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.white, borderRadius: 20, padding: 20 },
  reflectionTitle: { fontSize: 17, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 12 },
  reflection: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24 },
  noteCard: { marginHorizontal: 16, marginBottom: 32, backgroundColor: Colors.white, borderRadius: 20, padding: 20 },
  noteTitle: { fontSize: 17, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 12 },
  noteInput: { backgroundColor: Colors.primaryUltraLight, borderRadius: 12, padding: 14, fontSize: 15, color: Colors.textPrimary, minHeight: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: Colors.border },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 15 },
});

export default DevotionalScreen;
