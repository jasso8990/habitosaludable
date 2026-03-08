// app/services/chatService.js
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../../core/supabase/client';
import { decryptTextWithPrivateKey, encryptTextWithPublicKey } from '../../../core/security/e2eeCrypto';

const E2EE_PREFIX = '__E2EE__';

const toBase64Json = (obj) => {
  const json = JSON.stringify(obj);
  if (globalThis.Buffer) return globalThis.Buffer.from(json, 'utf8').toString('base64');
  return globalThis.btoa(unescape(encodeURIComponent(json)));
};

const fromBase64Json = (base64) => {
  const json = globalThis.Buffer
    ? globalThis.Buffer.from(base64, 'base64').toString('utf8')
    : decodeURIComponent(escape(globalThis.atob(base64)));
  return JSON.parse(json);
};

const privateKeyStorageKey = (userId) => `e2ee:private:${userId}`;

const buildEncryptedEnvelope = async ({ plainText, participantIds }) => {
  const { data: keys, error } = await supabase
    .from('user_keyring')
    .select('user_id, public_key')
    .in('user_id', participantIds);

  if (error) throw error;

  const byUser = new Map((keys || []).map((k) => [k.user_id, k.public_key]));
  const missing = participantIds.filter((id) => !byUser.get(id));
  if (missing.length) {
    throw new Error(`No hay llave pública para: ${missing.join(', ')}`);
  }

  const payloads = {};
  for (const uid of participantIds) {
    payloads[uid] = await encryptTextWithPublicKey(byUser.get(uid), plainText);
  }

  return `${E2EE_PREFIX}${toBase64Json({ v: 1, alg: 'RSA-OAEP-2048-SHA256', payloads })}`;
};

const decodeEncryptedMessage = async ({ content, currentUserId }) => {
  if (!content?.startsWith(E2EE_PREFIX)) return content;

  try {
    const envelope = fromBase64Json(content.slice(E2EE_PREFIX.length));
    const cipher = envelope?.payloads?.[currentUserId];
    if (!cipher) return '🔐 Mensaje cifrado';

    const privateKey = await SecureStore.getItemAsync(privateKeyStorageKey(currentUserId));
    if (!privateKey) return '🔐 Mensaje cifrado (sin llave local)';

    return await decryptTextWithPrivateKey(privateKey, cipher);
  } catch {
    return '🔐 Mensaje cifrado';
  }
};

const decodeMessageForUser = async (message, currentUserId) => {
  if (!currentUserId || message?.type !== 'text') return message;

  const decoded = await decodeEncryptedMessage({ content: message.content, currentUserId });
  return { ...message, content: decoded };
};

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
  try {
    let safeContent = content;

    if (type === 'text') {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('user1_id, user2_id')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      const participantIds = [conv.user1_id, conv.user2_id].filter(Boolean);
      safeContent = await buildEncryptedEnvelope({ plainText: content, participantIds });
    }

    const { data, error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: safeContent,
      type,
      media_url: mediaUrl,
      sent_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;
    return { success: true, message: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getMessages = async (conversationId, currentUserId = null) => {
  const { data, error } = await supabase.from('messages').select(`
    *, sender:user_profiles!sender_id(id, full_name, avatar_url)
  `).eq('conversation_id', conversationId).order('sent_at', { ascending: true }).limit(100);

  if (error) return { success: false, messages: [], error: error.message };

  const decoded = await Promise.all((data || []).map((m) => decodeMessageForUser(m, currentUserId)));
  return { success: true, messages: decoded };
};

export const subscribeToMessages = (conversationId, currentUserId, onMessage) => {
  const ch = supabase.channel(`conv:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      async (payload) => {
        const decoded = await decodeMessageForUser(payload.new, currentUserId);
        onMessage(decoded);
      }
    )
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
