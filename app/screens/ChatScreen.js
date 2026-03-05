// app/screens/ChatScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Colors } from '../constants/colors';
import { getMessages, sendMessage, subscribeToMessages, markAsRead, blockUser, isUserBlocked, unblockUser, uploadChatMedia } from '../services/chatService';

export default function ChatScreen({ route, navigation }) {
  const { conversationId, otherUser, currentUserId } = route.params;
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRec, setIsRec] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      title: otherUser?.full_name || 'Chat',
      headerRight: () => (
        <TouchableOpacity onPress={showOptions} style={{ marginRight: 16 }}>
          <Ionicons name="ellipsis-vertical" size={22} color={Colors.white} />
        </TouchableOpacity>
      ),
    });
    load();
    isUserBlocked(currentUserId, otherUser?.id).then(setBlocked);
    const unsub = subscribeToMessages(conversationId, m => setMsgs(prev => [...prev, m]));
    return unsub;
  }, []);

  const load = async () => {
    const r = await getMessages(conversationId);
    if (r.success) { setMsgs(r.messages); markAsRead(conversationId, currentUserId); }
  };

  const showOptions = () => {
    Alert.alert(otherUser?.full_name, '', [
      { text: blocked ? 'Desbloquear usuario' : 'Bloquear usuario', style: 'destructive',
        onPress: async () => { blocked ? await unblockUser(currentUserId, otherUser.id) : await blockUser(currentUserId, otherUser.id); setBlocked(!blocked); } },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleSend = async () => {
    if (!text.trim() || blocked) return;
    const t2 = text.trim(); setText('');
    await sendMessage({ conversationId, senderId: currentUserId, content: t2, type: 'text' });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!r.canceled) {
      const up = await uploadChatMedia(currentUserId, r.assets[0].uri, 'image');
      if (up.success) await sendMessage({ conversationId, senderId: currentUserId, content: '📷 Imagen', type: 'image', mediaUrl: up.url });
    }
  };

  const startRec = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') return;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording: r } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    setRecording(r); setIsRec(true);
  };

  const stopRec = async () => {
    if (!recording) return;
    setIsRec(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI(); setRecording(null);
    const up = await uploadChatMedia(currentUserId, uri, 'audio');
    if (up.success) await sendMessage({ conversationId, senderId: currentUserId, content: '🎤 Audio', type: 'audio', mediaUrl: up.url });
  };

  const renderMsg = ({ item }) => {
    const isMe = item.sender_id === currentUserId;
    return (
      <View style={[styles.row, isMe && styles.rowMe]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {item.type === 'image' ? (
            <Image source={{ uri: item.media_url }} style={styles.img} />
          ) : (
            <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.content}</Text>
          )}
          <Text style={[styles.time, isMe && styles.timeMe]}>
            {new Date(item.sent_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
            {isMe && <Text> {item.is_read ? ' ✓✓' : ' ✓'}</Text>}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {blocked && <View style={styles.blockedBanner}><Text style={styles.blockedTxt}>Usuario bloqueado</Text></View>}

      <FlatList ref={listRef} data={msgs} keyExtractor={i => i.id} renderItem={renderMsg}
        contentContainerStyle={styles.list} onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={<Text style={styles.emptyChat}>Envía el primer mensaje 👋</Text>} />

      {!blocked && (
        <View style={styles.bar}>
          <TouchableOpacity onPress={pickImage} style={styles.barIcon}>
            <Ionicons name="image-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TextInput style={styles.input} placeholder="Mensaje..." placeholderTextColor={Colors.textLight}
            value={text} onChangeText={setText} multiline />
          {text.trim() ? (
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Ionicons name="send" size={19} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.sendBtn, isRec && styles.sendBtnRec]} onPressIn={startRec} onPressOut={stopRec}>
              <Ionicons name={isRec ? 'stop' : 'mic'} size={19} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECF3FF' },
  blockedBanner: { backgroundColor: Colors.error, padding: 8, alignItems: 'center' },
  blockedTxt: { color: Colors.white, fontWeight: '600', fontSize: 13 },
  list: { padding: 12 },
  row: { flexDirection: 'row', marginBottom: 6 },
  rowMe: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', padding: 10, borderRadius: 18 },
  bubbleThem: { backgroundColor: Colors.white, borderBottomLeftRadius: 3 },
  bubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 3 },
  msgText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  msgTextMe: { color: Colors.white },
  img: { width: 200, height: 160, borderRadius: 12 },
  time: { fontSize: 10, color: Colors.textLight, marginTop: 3, alignSelf: 'flex-end' },
  timeMe: { color: 'rgba(255,255,255,0.65)' },
  emptyChat: { textAlign: 'center', color: Colors.textSecondary, marginTop: 40, fontSize: 15 },
  bar: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.divider, gap: 8 },
  barIcon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, minHeight: 40, maxHeight: 110, backgroundColor: Colors.primaryUltraLight, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 9, fontSize: 14, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnRec: { backgroundColor: Colors.error },
});
