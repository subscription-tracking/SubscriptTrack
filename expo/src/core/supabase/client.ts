import { createClient } from '@supabase/supabase-js';

import { env } from '../config/env';
import { secureSessionStorage } from '../storage/secureSessionStorage';

/**
 * Tek Supabase istemcisi. Backend Flutter sürümüyle aynıdır: aynı proje, aynı
 * şema, aynı RLS ve aynı RPC/Edge Function sözleşmesi ([API.md](../../../../docs/reference/API.md)).
 *
 * - Oturum ve PKCE verifier güvenli depoda tutulur (Flutter F-16 ile aynı).
 * - PKCE akışı kullanılır; e-posta bağlantıları `auth-callback` rotasında
 *   `exchangeCodeForSession` ile işlenir, bu yüzden URL'den otomatik oturum
 *   okunmaz.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: secureSessionStorage,
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
