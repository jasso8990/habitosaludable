import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../../core/supabase/client';
import { decryptTextWithPrivateKey, encryptTextWithPublicKey } from '../../../core/security/e2eeCrypto';

const NOTE_E2EE_PREFIX = '__E2EE_NOTE__';
const privateKeyStorageKey = (userId) => `e2ee:private:${userId}`;

export const encryptDevotionalNote = async (userId, note) => {
  const { data: keyRow, error } = await supabase
    .from('user_keyring')
    .select('public_key')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !keyRow?.public_key) {
    throw new Error('No se encontró llave pública para cifrar la nota.');
  }

  const cipher = await encryptTextWithPublicKey(keyRow.public_key, note);
  return `${NOTE_E2EE_PREFIX}${cipher}`;
};

export const decryptDevotionalNote = async (userId, storedValue) => {
  if (!storedValue) return '';
  if (!storedValue.startsWith(NOTE_E2EE_PREFIX)) return storedValue;

  const privateKey = await SecureStore.getItemAsync(privateKeyStorageKey(userId));
  if (!privateKey) {
    throw new Error('No se encontró llave privada local para leer la nota.');
  }

  const cipher = storedValue.slice(NOTE_E2EE_PREFIX.length);
  return decryptTextWithPrivateKey(privateKey, cipher);
};

export const isEncryptedDevotionalNote = (value) => String(value || '').startsWith(NOTE_E2EE_PREFIX);
