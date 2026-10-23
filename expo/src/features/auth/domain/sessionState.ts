import { toAppUser, type AppUser, type SessionUserInput } from './appUser';

/** Oturum olayı adı (Supabase `onAuthStateChange` olayları). */
export type AuthEventName = string;

/** Oturum görünümü: yalnızca kullanıcı gerekir. */
export interface SessionSnapshot {
  user: SessionUserInput;
}

/**
 * Oturum durumu ve yönlendirme kuralları. I/O içermez; birim testle doğrulanır.
 * Flutter `AuthController._onAuthStateChange` ve `app_router` yönlendirmesinin
 * karşılığıdır.
 */

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

export interface SessionState {
  status: AuthStatus;
  user: AppUser | null;
  /** E-posta bağlantısıyla şifre sıfırlama oturumu açıldı; yeni şifre girilmeli. */
  passwordRecoveryMode: boolean;
}

export const INITIAL_SESSION_STATE: SessionState = {
  status: 'unknown',
  user: null,
  passwordRecoveryMode: false,
};

export function reduceSession(
  state: SessionState,
  event: AuthEventName,
  session: SessionSnapshot | null,
): SessionState {
  switch (event) {
    case 'PASSWORD_RECOVERY':
      return {
        status: session ? 'authenticated' : 'unauthenticated',
        user: session ? toAppUser(session.user) : null,
        passwordRecoveryMode: true,
      };

    case 'USER_UPDATED':
      return {
        ...state,
        user: session ? toAppUser(session.user) : state.user,
        passwordRecoveryMode: false,
      };

    case 'SIGNED_OUT':
      return { status: 'unauthenticated', user: null, passwordRecoveryMode: false };

    default:
      // INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED ve diğerleri:
      // mevcut oturum varsa kullanıcıyı, yoksa çıkış yapılmış durumunu yansıtır.
      return {
        status: session ? 'authenticated' : 'unauthenticated',
        user: session ? toAppUser(session.user) : null,
        passwordRecoveryMode: state.passwordRecoveryMode && session !== null,
      };
  }
}

export type RouteGroup = '(auth)' | '(app)' | 'auth-callback' | 'legal' | string | undefined;

/** Oturum durumundan bağımsız, herkese açık rota grupları (yasal metinler). */
const PUBLIC_GROUPS: readonly string[] = ['legal'];

/**
 * Oturum durumuna göre hedef rotayı döner; yönlendirme gerekmiyorsa `null`.
 *
 * @param group  Mevcut rotanın ilk segmenti (`(auth)`, `(app)`, `auth-callback`).
 * @param screen Mevcut rotanın ikinci segmenti, varsa (örn. `reset-password`).
 * @param onboardingNeeded İlk açılışta tanıtım gösterilecekse (oturum yokken); bkz. Flutter `onboardingNeeded`.
 */
export function resolveRedirect(
  state: SessionState,
  group: RouteGroup,
  screen?: string,
  onboardingNeeded = false,
): string | null {
  if (state.status === 'unknown') return null;

  if (state.status === 'authenticated') {
    if (state.passwordRecoveryMode) {
      return screen === 'reset-password' ? null : '/reset-password';
    }
    // Oturum açık ama kullanıcı auth ekranında ya da callback'te: ana sayfaya.
    return group === '(app)' || PUBLIC_GROUPS.includes(group ?? '') ? null : '/';
  }

  // Oturum yokken tanıtım henüz görülmediyse önce onboarding (tanıtım sayfası dışındaki auth ekranları da bekler).
  if (onboardingNeeded && screen !== 'onboarding' && group !== 'legal' && group !== 'auth-callback') return '/onboarding';

  // Oturum yok: yalnızca auth ekranları ve callback açık.
  if (group === '(auth)' || group === 'auth-callback' || PUBLIC_GROUPS.includes(group ?? '')) return null;
  return '/login';
}
