// app/screens/StoriesScreen.js
// Pantalla de historias de logros compartidos

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { supabase } from '../services/supabase';
import { useTranslation } from '../i18n/useTranslation';

const StoriesScreen = () => {
  const { t } = useTranslation();
  const [stories, setStories] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadStories();
      }
    };
    init();
  }, []);

  const loadStories = async () => {
    const { data, error } = await supabase
      .from('stories')
      .select(`*, author:user_profiles!user_id (id, full_name, avatar_url)`)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error) setStories(data || []);
  };

  const handleLike = async (storyId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('story_likes')
      .insert({ story_id: storyId, user_id: user.id });

    if (!error) {
      await supabase.from('stories').update({ likes_count: supabase.rpc('increment') }).eq('id', storyId);
      loadStories();
    }
  };

  const renderStory = ({ item }) => (
    <View style={styles.storyCard}>
      <View style={styles.storyHeader}>
        <View style={styles.authorAvatar}>
          <Text style={styles.authorAvatarText}>{item.author?.full_name?.[0] || '?'}</Text>
        </View>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{item.author?.full_name || 'Usuario'}</Text>
          <Text style={styles.storyDate}>{new Date(item.created_at).toLocaleDateString('es-MX')}</Text>
        </View>
        {item.percentage && (
          <View style={styles.percentageBadge}>
            <Text style={styles.percentageText}>{item.percentage}%</Text>
          </View>
        )}
      </View>

      <Text style={styles.storyTitle}>{item.title}</Text>
      <Text style={styles.storyMessage}>{item.message}</Text>

      {item.image_url && <Image source={{ uri: item.image_url }} style={styles.storyImage} />}

      <View style={styles.storyActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item.id)}>
          <Ionicons name="heart-outline" size={20} color={Colors.error} />
          <Text style={styles.actionText}>{item.likes_count || 0} {t('stories.like')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
          <Text style={styles.actionText}>{t('stories.comment')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={stories}
        keyExtractor={item => item.id}
        renderItem={renderStory}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyText}>{t('stories.noStories')}</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16 },
  storyCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  storyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  authorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  authorAvatarText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  storyDate: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  percentageBadge: { backgroundColor: Colors.success, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  percentageText: { color: Colors.white, fontWeight: 'bold', fontSize: 13 },
  storyTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 8 },
  storyMessage: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 12 },
  storyImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  storyActions: { flexDirection: 'row', gap: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.divider },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 14, color: Colors.textSecondary },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center' },
});

export default StoriesScreen;
