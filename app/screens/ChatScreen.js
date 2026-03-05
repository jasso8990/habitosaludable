// app/screens/ChatScreen.js
// Pantalla de conversación individual (tipo WhatsApp)

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Colors } from '../constants/colors';
import {
  getMessages, sendMessage, subscribeToMessages,
  markAsRead, blockUser, isUserBlocked, uploadChatMedia,
} from '../services/chatService';

const ChatScreen = ({ route, navigation }) => {
  const { conversationId, otherUser, currentUserId } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      title: otherUser?.full_name || 'Chat',
      headerRight: () => (
        <TouchableOpacity onPress={handleOptions} style={{ marginRight: 16 }}>
          <Ionicons name="ellipsis-vertical" size={22} color={Colors.white} />
        </TouchableOpacity>
      ),
    });

    loadMessages();
    const unsubscribe = subscribeToMessages(conversationId, (newMsg) => {
      setMessages(prev => [...prev, newMsg]);
    });

    isUserBlocked(currentUserId, otherUser?.id).then(setBlocked);

    return unsubscribe;
  }, []);

  const loadMessages = async () => {
    const result = await getMessages(conversationId);
    if (result.success) {
      setMessages(result.messages);
      markAsRead(conversationId, currentUserId);
    }
  };

  const handleOptions = () => {
    Alert.alert(otherUser?.full_name, '', [
      { text: blocked ? 'Desbloquear' : 'Bloquear usuario', style: 'destructive', onPress: () => blockUser(currentUserId, otherUser?.id) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleSend = async () => {
    if (!inputText.trim() || blocked) return;
    const text = inputText.trim();
    setInputText('');
    await sendMessage({ conversationId, senderId: currentUserId, content: text, type: 'text' });
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      const file = { uri: result.assets[0].uri };
      const uploadResult = await uploadChatMedia(currentUserId, file, 'image');
      if (uploadResult.success) {
        await sendMessage({ conversationId, senderId: currentUserId, content: '📷 Imagen', type: 'image', mediaUrl: uploadResult.url });
      }
    }
  };

  const startRecording = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') return;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    setRecording(recording);
    setIsRecording(true);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    const uploadResult = await uploadChatMedia(currentUserId, { uri }, 'audio');
    if (uploadResult.success) {
      await sendMessage({ conversationId, senderId: currentUserId, content: '🎤 Audio', type: 'audio', mediaUrl: uploadResult.url });
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender_id === currentUserId;
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {item.type === 'image' ? (
            <Image source={{ uri: item.media_url }} style={styles.msgImage} />
          ) : item.type === 'audio' ? (
            <Text style={[styles.msgText, isMe && styles.msgTextMe]}>🎤 Mensaje de voz</Text>
          ) : (
            <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.content}</Text>
          )}
          <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>
            {new Date(item.sent_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {blocked && (
        <View style={styles.blockedBanner}>
          <Text style={styles.blockedText}>Has bloqueado a este usuario</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.msgList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {!blocked && (
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={handlePickImage}>
            <Ionicons name="image-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={Colors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          {inputText.trim() ? (
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Ionicons name="send" size={20} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendBtn, isRecording && { backgroundColor: Colors.error }]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
            >
              <Ionicons name={isRecording ? 'stop' : 'mic'} size={20} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.chatBackground },
  blockedBanner: { backgroundColor: Colors.error, padding: 10, alignItems: 'center' },
  blockedText: { color: Colors.white, fontWeight: '600' },
  msgList: { padding: 12, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 8 },
  msgRowMe: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', padding: 10, borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  bubbleThem: { backgroundColor: Colors.white, borderBottomLeftRadius: 4 },
  bubbleMe: { backgroundColor: Colors.chatBubbleSent, borderBottomRightRadius: 4 },
  msgText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 21 },
  msgTextMe: { color: Colors.white },
  msgTime: { fontSize: 11, color: Colors.textLight, marginTop: 4, alignSelf: 'flex-end' },
  msgTimeMe: { color: 'rgba(255,255,255,0.6)' },
  msgImage: { width: 200, height: 160, borderRadius: 12 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.divider, gap: 8 },
  iconBtn: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, minHeight: 42, maxHeight: 120, backgroundColor: Colors.primaryUltraLight, borderRadius: 21, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
});

export default ChatScreen;
