// app/screens/AssistantScreen.js
// Pantalla del Asistente IA para crear y mejorar hábitos

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { sendMessageToAssistant } from '../services/aiService';
import { createHabit } from '../services/habitService';
import { scheduleHabitReminder } from '../services/notificationService';
import { supabase } from '../services/supabase';
import { useTranslation } from '../i18n/useTranslation';

const AssistantScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const flatListRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      id: '0',
      role: 'assistant',
      content: t('assistant.greeting'),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase
          .from('user_profiles')
          .select('is_premium')
          .eq('id', user.id)
          .single();
        setIsPremium(data?.is_premium || false);
      }
    };
    init();
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: inputText.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setLoading(true);

    // Preparar historial para la API
    const apiMessages = messages
      .filter(m => m.id !== '0')
      .map(m => ({ role: m.role, content: m.content }));
    apiMessages.push({ role: 'user', content: inputText.trim() });

    const result = await sendMessageToAssistant(apiMessages, inputText.trim());
    setLoading(false);

    if (result.success) {
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message,
        habitPlan: result.habitPlan,
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Si el asistente generó un plan de hábito, ofrecer crearlo
      if (result.habitPlan) {
        setTimeout(() => {
          Alert.alert(
            '🌱 Plan de Hábito Listo',
            `¿Deseas crear el hábito: "${result.habitPlan.title}"?`,
            [
              { text: t('common.cancel'), style: 'cancel' },
              { text: '¡Crear Hábito!', onPress: () => handleCreateHabit(result.habitPlan) },
            ]
          );
        }, 500);
      }
    } else {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error. Por favor intenta de nuevo.',
      }]);
    }

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleCreateHabit = async (habitPlan) => {
    const result = await createHabit(userId, habitPlan, isPremium);

    if (result.limitReached) {
      Alert.alert(
        '⭐ Límite Alcanzado',
        t('assistant.freeLimit') + '\n\n' + t('assistant.upgradePrompt'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('assistant.upgradePremium'), onPress: () => navigation.navigate('Premium') },
        ]
      );
      return;
    }

    if (result.success) {
      // Programar notificación
      await scheduleHabitReminder(result.habit);
      Alert.alert('🎉 ¡Hábito Creado!', `"${habitPlan.title}" ha sido agregado a tu lista.`);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={styles.avatarBot}>
            <Text style={styles.avatarBotText}>🤖</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {item.content}
          </Text>
          {item.habitPlan && (
            <View style={styles.planBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.planBadgeText}>Plan de hábito generado</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Info banner */}
      {!isPremium && (
        <TouchableOpacity style={styles.premiumBanner} onPress={() => navigation.navigate('Premium')}>
          <Ionicons name="star" size={16} color={Colors.premium} />
          <Text style={styles.premiumBannerText}>
            Versión gratuita: máximo 3 hábitos • Toca para Premium
          </Text>
        </TouchableOpacity>
      )}

      {/* Lista de mensajes */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Indicador de escritura */}
      {loading && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>El asistente está escribiendo</Text>
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />
        </View>
      )}

      {/* Input de mensaje */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu meta o pregunta..."
          placeholderTextColor={Colors.textLight}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          <Ionicons name="send" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.chatBackground },
  premiumBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF9E6', paddingVertical: 8, paddingHorizontal: 16, gap: 6,
    borderBottomWidth: 1, borderBottomColor: '#FFE9A0',
  },
  premiumBannerText: { fontSize: 12, color: Colors.accent },
  messagesList: { padding: 16, paddingBottom: 8 },
  messageRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  messageRowUser: { justifyContent: 'flex-end' },
  avatarBot: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryUltraLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  avatarBotText: { fontSize: 18 },
  bubble: {
    maxWidth: '78%', padding: 12, borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  bubbleBot: { backgroundColor: Colors.white, borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: Colors.chatBubbleSent, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  bubbleTextUser: { color: Colors.white },
  planBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 8, backgroundColor: '#F0FFF4', padding: 6, borderRadius: 8,
  },
  planBadgeText: { fontSize: 12, color: Colors.success },
  typingIndicator: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  typingText: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.divider,
    gap: 8,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: Colors.primaryUltraLight,
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border,
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: Colors.border },
});

export default AssistantScreen;
