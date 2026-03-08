// app/services/supabase.js
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = 'https://usqugtxeynkozlobeojt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcXVndHhleW5rb3psb2Jlb2p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTYxMzAsImV4cCI6MjA4NjY3MjEzMH0.zs4XiF8AgcE-l3ebtaxvoN7V9rf-6MHWNxMThiQUXKE';

const ExpoSecureStoreAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
export default supabase;
