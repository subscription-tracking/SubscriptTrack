import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { supabase } from '../../../core/supabase/client';
import { localizeAuthError } from '../domain/authErrors';
import { toAppUser, type AppUser } from '../domain/appUser';
import type { AuthEventName, SessionSnapshot } from '../domain/sessionState';
import { normalizeEmail } from '../domain/authRules';

/**
 * Supabase Auth çağrıları. Flutter `SupabaseAuthRepository` ile aynı sözleşme:
 * hatalar kullanıcıya gösterilebilir Türkçe mesajla [AuthFailure] olarak fırlatılır.
 */

/**
 * E-posta bağlantılarının döneceği adres. Çalışma ortamına göre üretilir:
 * - Development build / release: `subscripttrack://auth-callback` (app.json scheme)
 * - Expo Go: `exp://<ip>:8081/--/auth-callback` (Expo Go kendi şemasını kullanır)
 * Bu adresler Supabase Auth → URL Configuration → Redirect URLs listesinde olmalıdır.
 */
export const AUTH_REDIRECT_URL = Linking.createURL('auth-callback');

export class AuthFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthFailure';
  }
}

function toFailure(error: Error | unknown): AuthFailure {
  const message = error instanceof Error ? error.message : undefined;
  return new AuthFailure(localizeAuthError(message));
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });
  if (error) throw toFailure(error);
  if (!data.user) throw new AuthFailure('Giriş başarısız.');
  return toAppUser(data.user);
}

export interface SignUpResult {
  /** Oturum açılmadıysa kullanıcının e-postasını doğrulaması gerekir. */
  requiresEmailConfirmation: boolean;
}

export async function signUp(email: string, password: string): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: normalizeEmail(email),
    password,
    options: { emailRedirectTo: AUTH_REDIRECT_URL },
  });
  if (error) {
    if (/already registered|already been registered|already exists/i.test(error.message)) {
      return { requiresEmailConfirmation: true };
    }
    throw toFailure(error);
  }
  if (!data.user) throw new AuthFailure('Kayıt başarısız.');
  // Kayıtlı adres için Supabase sahte kullanıcı dönebilir; hesap varlığını sızdırma.
  if (data.user.identities?.length === 0) return { requiresEmailConfirmation: true };
  return {
    requiresEmailConfirmation: data.session === null,
  };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw toFailure(error);
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
    redirectTo: AUTH_REDIRECT_URL,
  });
  if (error) throw toFailure(error);
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw toFailure(error);
}

/** Görünen adı kullanıcı verisine yazar (Flutter `updateDisplayName`). */
export async function updateDisplayName(name: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ data: { display_name: name } });
  if (error) throw toFailure(error);
}

/** E-posta adresini günceller; Supabase gerekirse doğrulama bağlantısı gönderir (Flutter `updateEmail`). */
export async function updateEmail(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized.includes('@')) throw new AuthFailure('Geçerli bir e-posta adresi gir.');
  const { error } = await supabase.auth.updateUser({ email: normalized });
  if (error) throw toFailure(error);
}

/**
 * E-posta bağlantısından gelen PKCE kodunu oturuma çevirir (doğrulama ve
 * şifre sıfırlama). Hata metni bağlantının süresinin dolduğunu da kapsar.
 */
export async function exchangeCodeForSession(code: string): Promise<Session> {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw toFailure(error);
  if (!data.session) throw new AuthFailure('Bağlantı geçersiz ya da süresi dolmuş.');
  return data.session;
}

/** Oturum olaylarına abone olur; dönen fonksiyon aboneliği kapatır. */
export function subscribeToAuthChanges(
  listener: (event: AuthEventName, session: SessionSnapshot | null) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    listener(event, session ? { user: session.user } : null);
  });
  return () => data.subscription.unsubscribe();
}
