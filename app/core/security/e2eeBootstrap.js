import * as SecureStore from 'expo-secure-store';
import { supabase } from '../supabase/client';
import { generateUserKeyPair } from './e2eeCrypto';

const privateKeyStorageKey = (userId) => `e2ee:private:${userId}`;
const publicKeyStorageKey = (userId) => `e2ee:public:${userId}`;

export const ensureUserE2EEKeys = async (userId) => {
  const [privateKey, publicKey] = await Promise.all([
    SecureStore.getItemAsync(privateKeyStorageKey(userId)),
    SecureStore.getItemAsync(publicKeyStorageKey(userId)),
  ]);

  if (privateKey && publicKey) return { privateKey, publicKey, created: false };

  const generated = await generateUserKeyPair();
  await Promise.all([
    SecureStore.setItemAsync(privateKeyStorageKey(userId), generated.privateKey),
    SecureStore.setItemAsync(publicKeyStorageKey(userId), generated.publicKey),
  ]);

  return { ...generated, created: true };
};

export const syncPublicKey = async (userId, publicKey) => {
  const { error } = await supabase.from('user_keyring').upsert(
    {
      user_id: userId,
      public_key: publicKey,
      algorithm: 'RSA-OAEP-2048-SHA256',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) throw error;
};

export const bootstrapUserE2EE = async (userId) => {
  const keys = await ensureUserE2EEKeys(userId);
  await syncPublicKey(userId, keys.publicKey);
  return keys;
};
