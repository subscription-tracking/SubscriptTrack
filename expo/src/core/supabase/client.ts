import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { env } from '../config/env';

/**
 * Tek Supabase istemcisi. Backend Flutter sürümüyle aynıdır: aynı proje, aynı
 * şema, aynı RLS ve aynı RPC/Edge Function sözleşmesi ([API.md](../../../../docs/reference/API.md)).
 *
 * Oturum AsyncStorage'da tutulur (Supabase'in önerdiği varsayılan). Finansal
 * veri cache'i ise Aşama 3'te güvenli depolamaya taşınır ([LIBRARIES.md](../../../../docs/expo/LIBRARIES.md)).
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    // Mobilde URL'den oturum okunmaz; e-posta dönüşü deep link ile işlenir.
    detectSessionInUrl: false,
  },
});
