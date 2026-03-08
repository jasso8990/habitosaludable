// app/screens/DevotionalScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { supabase } from '../../../core/supabase/client';
import {
  decryptDevotionalNote,
  encryptDevotionalNote,
  isEncryptedDevotionalNote,
} from '../services/devotionalNoteE2EE';

export default function DevotionalScreen() {
  const [dev, setDev] = useState(null);
  const [note, setNote] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('devotionals').select('*').eq('date', today).maybeSingle();
      if (data) {
        setDev(data);
        // Cargar nota guardada
        if (user) {
          const { data: n } = await supabase.from('devotional_notes').select('note').eq('user_id', user.id).eq('devotional_id', data.id).maybeSingle();
          if (n?.note) {
            try {
              const visibleNote = await decryptDevotionalNote(user.id, n.note);
              setNote(visibleNote);
              setSavedNote(visibleNote);
            } catch (error) {
              console.warn('No se pudo descifrar la nota devocional:', error);
              const fallback = isEncryptedDevotionalNote(n.note)
                ? ''
                : n.note;
              setNote(fallback);
              setSavedNote(fallback);
              if (isEncryptedDevotionalNote(n.note)) {
                Alert.alert('Privacidad', 'No se pudo leer la nota cifrada en este dispositivo.');
              }
            }
          }
        }
      } else {
        setDev({
          id: 'default',
          verse: '"Todo lo puedo en Cristo que me fortalece."',
          verse_reference: 'Filipenses 4:13',
          reflection: 'Cada hábito que construyes hoy es una semilla que florecerá mañana. Con fe y constancia, pequeños pasos crean grandes transformaciones. Tu mejor versión se construye en las decisiones cotidianas.',
        });
      }
    };
    load();
  }, []);

  const saveNote = async () => {
    if (!note.trim() || dev?.id === 'default') { Alert.alert('Nota', 'Nota guardada localmente'); setSavedNote(note); return; }
    let noteToStore = note;
    try {
      noteToStore = await encryptDevotionalNote(userId, note);
    } catch (error) {
      console.warn('No se pudo cifrar la nota devocional:', error);
      Alert.alert('Privacidad', 'No se pudo cifrar tu nota, intenta nuevamente.');
      return;
    }

    const { error } = await supabase.from('devotional_notes').upsert({ user_id: userId, devotional_id: dev.id, note: noteToStore });
    if (!error) { setSavedNote(note); Alert.alert('✅', 'Nota guardada exitosamente'); }
  };

  const shareVerse = () => Share.share({ message: `📖 ${dev?.verse}\n— ${dev?.verse_reference}\n\nReflexión: ${dev?.reflection}\n\n- Hábitos Saludables App` });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.verseCard}>
        <Text style={styles.verseLabel}>📖 Versículo del Día</Text>
        <Text style={styles.verse}>{dev?.verse || 'Cargando...'}</Text>
        <Text style={styles.ref}>{dev?.verse_reference}</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={shareVerse}>
          <Ionicons name="share-outline" size={16} color={Colors.white} />
          <Text style={styles.shareBtnTxt}>Compartir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💭 Reflexión</Text>
        <Text style={styles.reflection}>{dev?.reflection}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✍️ Mi nota personal</Text>
        <TextInput style={styles.noteInput} placeholder="Escribe tu reflexión aquí..."
          placeholderTextColor={Colors.textLight} value={note} onChangeText={setNote} multiline numberOfLines={5} />
        {savedNote ? <Text style={styles.savedTxt}>✓ Nota guardada</Text> : null}
        <TouchableOpacity style={styles.saveBtn} onPress={saveNote}>
          <Text style={styles.saveBtnTxt}>Guardar nota</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  verseCard: { margin: 16, backgroundColor: Colors.primary, borderRadius: 22, padding: 24 },
  verseLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 12 },
  verse: { fontSize: 19, fontStyle: 'italic', color: Colors.white, lineHeight: 28, marginBottom: 10 },
  ref: { color: Colors.primaryLight, fontSize: 14, fontWeight: '600', textAlign: 'right', marginBottom: 14 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  shareBtnTxt: { color: Colors.white, fontSize: 13 },
  section: { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.white, borderRadius: 20, padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 12 },
  reflection: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  noteInput: { backgroundColor: Colors.primaryUltraLight, borderRadius: 12, padding: 14, fontSize: 14, color: Colors.textPrimary, minHeight: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: Colors.border },
  savedTxt: { fontSize: 12, color: Colors.success, marginTop: 6 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  saveBtnTxt: { color: Colors.white, fontWeight: 'bold', fontSize: 15 },
});
