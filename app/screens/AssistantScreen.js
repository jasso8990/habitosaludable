// app/screens/AssistantScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { supabase } from '../services/supabase';
import { sendMessageToAssistant } from '../services/aiService';
import { createHabit, getHabitCount } from '../services/habitService';
import { scheduleHabitReminder } from '../services/notificationService';
import { getUserProfile } from '../services/authService';
import { useTranslation } from '../i18n/useTranslation';

export default function AssistantScreen({ navigation }) {
  const { t } = useTranslation();
  const listRef = useRef(null);
  const [messages, setMessages] = useState([{ id: '0', role: 'assistant', content: t('assistant.greeting') }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { profile: p } = await getUserProfile(user.id).then(r => r.success ? r : { profile: null });
      const count = await getHabitCount(user.id);
      setProfile(p ? { ...p, habitCount: count } : null);
    };
    init();
  }, []);

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    const userMsg = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const history = messages.filter(m => m.id !== '0').map(m => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: text });

    const r = await sendMessageToAssistant(history, profile);
    setLoading(false);

    const botMsg = { id: Date.now().toString() + 'b', role: 'assistant', content: r.message, habitPlan: r.habitPlan };
    setMessages(prev => [...prev, botMsg]);

    if (r.habitPlan) {
      setTimeout(() => {
        Alert.alert('🌱 Plan creado', `¿Crear el hábito "${r.habitPlan.title}"?`, [
          { text: t('common.cancel'), style: 'cancel' },
          { text: 'Crear', onPress: () => handleCreate(r.habitPlan) },
        ]);
      }, 400);
    }
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleCreate = async (plan) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const r = await createHabit(user.id, plan, profile?.is_premium);
    if (r.limitReached) {
      Alert.alert('⭐ Límite alcanzado', t('assistant.freeLimit'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('assistant.upgradePremium'), onPress: () => navigation.navigate('Premium') },
      ]);
      return;
    }
    if (r.success) {
      await scheduleHabitReminder(r.habit);
      Alert.alert('🎉', t('assistant.habitCreated'));
      setProfile(p => p ? { ...p, habitCount: (p.habitCount || 0) + 1 } : p);
    }
  };

  const renderMsg = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowRight]}>
        {!isUser && <View style={styles.botAvatar}><Text style={{ fontSize: 16 }}>🤖</Text></View>}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.content}</Text>
          {item.habitPlan && (
            <View style={styles.planTag}>
              <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
              <Text style={styles.planTagText}>Plan generado ✓</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {!profile?.is_premium && (
        <TouchableOpacity style={styles.banner} onPress={() => navigation.navigate('Premium')}>
          <Ionicons name="star" size={14} color={Colors.premium} />
          <Text style={styles.bannerText}>Versión gratuita: máx. 3 hábitos · Toca para Premium</Text>
        </TouchableOpacity>
      )}

      <FlatList ref={listRef} data={messages} keyExtractor={i => i.id} renderItem={renderMsg}
        contentContainerStyle={styles.list} onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })} />

      {loading && (
        <View style={styles.typing}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.typingText}>  Escribiendo...</Text>
        </View>
      )}

      <View style={styles.inputBar}>
        <TextInput style={styles.input} placeholder="Escribe tu meta..." placeholderTextColor={Colors.textLight}
          value={input} onChangeText={setInput} multiline maxLength={500} />
        <TouchableOpacity style={[styles.sendBtn, !input.trim() && styles.sendBtnOff]} onPress={send} disabled={!input.trim() || loading}>
          <Ionicons name="send" size={19} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.chatBackground },
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFFDE7', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#FFE082' },
  bannerText: { fontSize: 12, color: Colors.accent },
  list: { padding: 14, paddingBottom: 6 },
  msgRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  msgRowRight: { justifyContent: 'flex-end' },
  botAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primaryUltraLight, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  bubble: { maxWidth: '78%', padding: 11, borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  bubbleBot: { backgroundColor: Colors.white, borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  bubbleTextUser: { color: Colors.white },
  planTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, backgroundColor: '#F0FFF4', padding: 5, borderRadius: 7 },
  planTagText: { fontSize: 11, color: Colors.success },
  typing: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 6 },
  typingText: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.divider, gap: 8 },
  input: { flex: 1, minHeight: 42, maxHeight: 110, backgroundColor: Colors.primaryUltraLight, borderRadius: 21, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnOff: { backgroundColor: Colors.border },
});
