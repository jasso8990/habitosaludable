// app/services/chatService.js
import { supabase } from './supabase';

export const getOrCreateConversation = async (uid1, uid2) => {
  const { data: existing } = await supabase.from('conversations').select('*')
    .or(`and(user1_id.eq.${uid1},user2_id.eq.${uid2}),and(user1_id.eq.${uid2},user2_id.eq.${uid1})`)
    .maybeSingle();
  if (existing) return { success: true, conversation: existing };

  const { data, error } = await supabase.from('conversations')
    .insert({ user1_id: uid1, user2_id: uid2 }).select().single();
  return { success: !error, conversation: data };
};

export const sendMessage = async ({ conversationId, senderId, content, type = 'text', mediaUrl = null }) => {
  const { data, error } = await supabase.from('messages').insert({
    conversation_id: conversationId, sender_id: senderId,
    content, type, media_url: mediaUrl, sent_at: new Date().toISOString(),
  }).select().single();
  return { success: !error, message: data };
};

export const getMessages = async (conversationId) => {
  const { data, error } = await supabase.from('messages').select(`
    *, sender:user_profiles!sender_id(id, full_name, avatar_url)
  `).eq('conversation_id', conversationId).order('sent_at', { ascending: true }).limit(100);
  return { success: !error, messages: data || [] };
};

export const subscribeToMessages = (conversationId, onMessage) => {
  const ch = supabase.channel(`conv:${conversationId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      payload => onMessage(payload.new))
    .subscribe();
  return () => supabase.removeChannel(ch);
};

export const getUserConversations = async (userId) => {
  const { data, error } = await supabase.from('conversations').select(`
    *, user1:user_profiles!user1_id(id, full_name, avatar_url),
    user2:user_profiles!user2_id(id, full_name, avatar_url)
  `).or(`user1_id.eq.${userId},user2_id.eq.${userId}`).order('updated_at', { ascending: false });
  return { success: !error, conversations: data || [] };
};

export const markAsRead = async (conversationId, userId) => {
  await supabase.from('messages').update({ is_read: true })
    .eq('conversation_id', conversationId).neq('sender_id', userId).eq('is_read', false);
};

export const blockUser = async (blockerId, blockedId) => {
  const { error } = await supabase.from('user_blocks').upsert({ blocker_id: blockerId, blocked_id: blockedId });
  return { success: !error };
};

export const unblockUser = async (blockerId, blockedId) => {
  await supabase.from('user_blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId);
};

export const isUserBlocked = async (userId, otherUserId) => {
  const { data } = await supabase.from('user_blocks').select('id')
    .or(`and(blocker_id.eq.${userId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${userId})`)
    .maybeSingle();
  return !!data;
};

export const uploadChatMedia = async (userId, fileUri, type) => {
  try {
    const ext = type === 'image' ? 'jpg' : 'm4a';
    const path = `${userId}/${Date.now()}.${ext}`;
    const bucket = type === 'image' ? 'chat-images' : 'chat-audios';
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const { error } = await supabase.storage.from(bucket).upload(path, blob);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { success: true, url: data.publicUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const searchUsersByPhone = async (phones) => {
  const { data } = await supabase.from('user_profiles')
    .select('id, full_name, phone, avatar_url').in('phone', phones);
  return data || [];
};
