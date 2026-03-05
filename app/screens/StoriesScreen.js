// app/screens/StoriesScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { supabase } from '../services/supabase';

export default function StoriesScreen() {
  const [stories, setStories] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { setUserId(user.id); load(); }
    };
    init();
  }, []);

  const load = async () => {
    const { data } = await supabase.from('stories')
      .select(`*, author:user_profiles!user_id(id, full_name)`)
      .eq('is_visible', true).order('created_at', { ascending: false }).limit(30);
    setStories(data || []);
  };

  const handleLike = async (id) => {
    if (!userId) return;
    await supabase.from('story_likes').upsert({ story_id: id, user_id: userId });
    await supabase.rpc('increment_likes', { story_id: id });
    load();
  };

  return (
    <View style={styles.container}>
      <FlatList data={stories} keyExtractor={i => i.id} contentContainerStyle={{ padding: 14 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.head}>
              <View style={styles.avatar}><Text style={styles.avatarTxt}>{item.author?.full_name?.[0] || '?'}</Text></View>
              <View style={styles.headInfo}>
                <Text style={styles.authorName}>{item.author?.full_name || 'Usuario'}</Text>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('es')}</Text>
              </View>
              {item.percentage != null && (
                <View style={styles.pctBadge}><Text style={styles.pctText}>{item.percentage}%</Text></View>
              )}
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item.id)}>
                <Ionicons name="heart-outline" size={18} color={Colors.error} />
                <Text style={styles.actionTxt}>{item.likes_count || 0} Me inspira</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => Share.share({ message: `🌱 ${item.title}\n${item.message}\n\n- Compartido desde Hábitos Saludables` })}>
                <Ionicons name="share-outline" size={18} color={Colors.primary} />
                <Text style={styles.actionTxt}>Compartir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 56 }}>🏆</Text>
            <Text style={styles.emptyTxt}>Aún no hay historias. ¡Completa hábitos para compartir tus logros!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: { backgroundColor: Colors.white, borderRadius: 18, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarTxt: { color: Colors.white, fontSize: 17, fontWeight: 'bold' },
  headInfo: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  date: { fontSize: 12, color: Colors.textLight },
  pctBadge: { backgroundColor: Colors.success, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  pctText: { color: Colors.white, fontWeight: 'bold', fontSize: 13 },
  title: { fontSize: 17, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 6 },
  message: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 18, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.divider },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionTxt: { fontSize: 13, color: Colors.textSecondary },
  empty: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 30 },
  emptyTxt: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginTop: 12 },
});
