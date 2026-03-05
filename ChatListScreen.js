// app/services/chatService.js
// Mensajes en tiempo real tipo WhatsApp

import { supabase } from './supabase';

// === OBTENER O CREAR CONVERSACIÓN ===
export const getOrCreateConversation = async (userId1, userId2) => {
  try {
    // Buscar conversación existente
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`)
      .single();

    if (existing) return { success: true, conversation: existing };

    // Crear nueva conversación
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user1_id: userId1, user2_id: userId2 })
      .select()
      .single();

    if (error) throw error;
    return { success: true, conversation: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === ENVIAR MENSAJE ===
export const sendMessage = async ({ conversationId, senderId, content, type = 'text', mediaUrl = null }) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        type,        // 'text', 'image', 'audio'
        media_url: mediaUrl,
        is_read: false,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, message: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === SUSCRIBIRSE A MENSAJES EN TIEMPO REAL ===
export const subscribeToMessages = (conversationId, onMessage) => {
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onMessage(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
};

// === OBTENER MENSAJES DE UNA CONVERSACIÓN ===
export const getMessages = async (conversationId, page = 0) => {
  const limit = 50;
  const offset = page * limit;

  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:user_profiles!sender_id (
          id, full_name, avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { success: true, messages: data.reverse() };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === OBTENER TODAS LAS CONVERSACIONES DEL USUARIO ===
export const getUserConversations = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        user1:user_profiles!user1_id (id, full_name, avatar_url),
        user2:user_profiles!user2_id (id, full_name, avatar_url),
        last_message:messages (content, type, sent_at)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return { success: true, conversations: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === MARCAR MENSAJES COMO LEÍDOS ===
export const markAsRead = async (conversationId, userId) => {
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('is_read', false);
};

// === BLOQUEAR USUARIO ===
export const blockUser = async (blockerId, blockedId) => {
  try {
    const { error } = await supabase
      .from('user_blocks')
      .insert({ blocker_id: blockerId, blocked_id: blockedId });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// === VERIFICAR SI USUARIO ESTÁ BLOQUEADO ===
export const isUserBlocked = async (userId, otherUserId) => {
  const { data } = await supabase
    .from('user_blocks')
    .select('id')
    .or(`and(blocker_id.eq.${userId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${userId})`)
    .single();

  return !!data;
};

// === SUBIR IMAGEN O AUDIO AL CHAT ===
export const uploadChatMedia = async (userId, file, type) => {
  try {
    const fileName = `${userId}/${Date.now()}.${type === 'image' ? 'jpg' : 'm4a'}`;
    const bucket = type === 'image' ? 'chat-images' : 'chat-audios';

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        contentType: type === 'image' ? 'image/jpeg' : 'audio/m4a',
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
