// app/screens/ChatListScreen.js
// Lista de conversaciones tipo WhatsApp

import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { Colors } from '../constants/colors';
import { getUserConversations } from '../services/chatService';
import { supabase } from '../services/supabase';
import { useTranslation } from '../i18n/useTranslation';

const ChatListScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [userId, setUserId] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadConversations(user.id);
      }
    };
    init();
  }, []);

  const loadConversations = async (uid) => {
    const result = await getUserConversations(uid);
    if (result.success) setConversations(result.conversations);
  };

  const requestContactsPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus contactos para encontrar amigos en la app.');
      return;
    }
    findFriendsInApp();
  };

  const findFriendsInApp = async () => {
    const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
    const phones = data.flatMap(c => c.phoneNumbers?.map(p => p.number.replace(/\D/g, '')) || []);

    const { data: appUsers } = await supabase
      .from('user_profiles')
      .select('id, full_name, phone, avatar_url')
      .neq('id', userId);

    const friends = appUsers?.filter(u =>
      phones.some(p => u.phone?.replace(/\D/g, '').includes(p) || p.includes(u.phone?.replace(/\D/g, '')))
    );

    if (!friends?.length) {
      Alert.alert('😔 Sin resultados', 'Ninguno de tus contactos usa la app todavía.');
      return;
    }

    Alert.alert(
      `🎉 ${friends.length} amigo(s) encontrado(s)`,
      friends.map(f => f.full_name).join(', '),
      [{ text: 'OK' }]
    );
  };

  const getOtherUser = (conv) => {
    return conv.user1_id === userId ? conv.user2 : conv.user1;
  };

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherUser(conv);
    return other?.full_name?.toLowerCase().includes(searchText.toLowerCase());
  });

  const renderItem = ({ item }) => {
    const other = getOtherUser(item);
    const lastMsg = item.last_message?.[0];

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat', {
          conversationId: item.id,
          otherUser: other,
          currentUserId: userId,
        })}
      >
        <View style={styles.avatar}>
          {other?.avatar_url ? (
            <Image source={{ uri: other.avatar_url }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>{other?.full_name?.[0]?.toUpperCase() || '?'}</Text>
          )}
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>{other?.full_name || 'Usuario'}</Text>
          <Text style={styles.chatLastMsg} numberOfLines={1}>
            {lastMsg?.type === 'image' ? '📷 Imagen' :
             lastMsg?.type === 'audio' ? '🎤 Audio' :
             lastMsg?.content || 'Iniciar conversación'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('chat.searchContacts')}
            placeholderTextColor={Colors.textLight}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity style={styles.contactsBtn} onPress={requestContactsPermission}>
          <Ionicons name="people" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Lista de conversaciones */}
      <FlatList
        data={filteredConversations}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>{t('chat.noMessages')}</Text>
            <TouchableOpacity style={styles.findFriendsBtn} onPress={requestContactsPermission}>
              <Text style={styles.findFriendsBtnText}>Buscar amigos</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryUltraLight, borderRadius: 22, paddingHorizontal: 14, gap: 8, height: 42 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  contactsBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primaryUltraLight, justifyContent: 'center', alignItems: 'center' },
  chatItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarImg: { width: 52, height: 52, borderRadius: 26 },
  avatarText: { color: Colors.white, fontSize: 20, fontWeight: 'bold' },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 3 },
  chatLastMsg: { fontSize: 13, color: Colors.textSecondary },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, marginBottom: 20 },
  findFriendsBtn: { backgroundColor: Colors.primary, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 24 },
  findFriendsBtnText: { color: Colors.white, fontWeight: '600' },
});

export default ChatListScreen;
