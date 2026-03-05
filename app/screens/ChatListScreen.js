// app/screens/ChatListScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { Colors } from '../constants/colors';
import { supabase } from '../services/supabase';
import { getUserConversations, getOrCreateConversation, searchUsersByPhone } from '../services/chatService';
import { useTranslation } from '../i18n/useTranslation';

export default function ChatListScreen({ navigation }) {
  const { t } = useTranslation();
  const [convs, setConvs] = useState([]);
  const [userId, setUserId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { setUserId(user.id); loadConvs(user.id); }
    };
    init();
  }, []);

  const loadConvs = async (uid) => {
    const r = await getUserConversations(uid);
    if (r.success) setConvs(r.conversations);
  };

  const findFriends = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso necesario', 'Necesitamos acceso a tus contactos'); return; }

    const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
    const phones = data.flatMap(c => c.phoneNumbers?.map(p => p.number.replace(/\D/g, '').slice(-10)) || []);
    const friends = await searchUsersByPhone([...new Set(phones)]);
    const others = friends.filter(f => f.id !== userId);

    if (!others.length) { Alert.alert('😔', 'Ningún contacto usa la app todavía.'); return; }

    Alert.alert(`🎉 ${others.length} amigo(s) encontrado(s)`,
      others.map(f => f.full_name).join(', '), [
        { text: 'Cerrar' },
        { text: 'Chatear con ' + others[0].full_name, onPress: () => openChat(others[0]) },
      ]);
  };

  const openChat = async (other) => {
    const r = await getOrCreateConversation(userId, other.id);
    if (r.success) navigation.navigate('Chat', { conversationId: r.conversation.id, otherUser: other, currentUserId: userId });
  };

  const getOther = (c) => c.user1_id === userId ? c.user2 : c.user1;

  const filtered = convs.filter(c => getOther(c)?.full_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={17} color={Colors.textLight} />
          <TextInput style={styles.input} placeholder={t('nav.chat') + '...'} placeholderTextColor={Colors.textLight}
            value={search} onChangeText={setSearch} />
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={findFriends}>
          <Ionicons name="people" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList data={filtered} keyExtractor={i => i.id} renderItem={({ item }) => {
        const other = getOther(item);
        return (
          <TouchableOpacity style={styles.item} onPress={() => openChat(other)}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{other?.full_name?.[0]?.toUpperCase() || '?'}</Text></View>
            <View style={styles.info}>
              <Text style={styles.name}>{other?.full_name || 'Usuario'}</Text>
              <Text style={styles.last} numberOfLines={1}>Toca para chatear</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={Colors.textLight} />
          </TouchableOpacity>
        );
      }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>Aún no tienes conversaciones</Text>
            <TouchableOpacity style={styles.findBtn} onPress={findFriends}>
              <Text style={styles.findBtnText}>Buscar amigos</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBar: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  searchInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryUltraLight, borderRadius: 20, paddingHorizontal: 14, height: 40, gap: 8 },
  input: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryUltraLight, justifyContent: 'center', alignItems: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText: { color: Colors.white, fontSize: 20, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  last: { fontSize: 13, color: Colors.textSecondary },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 14 },
  emptyText: { fontSize: 15, color: Colors.textSecondary, marginBottom: 18 },
  findBtn: { backgroundColor: Colors.primary, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 24 },
  findBtnText: { color: Colors.white, fontWeight: '600' },
});
