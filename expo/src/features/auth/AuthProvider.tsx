import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import * as authRepository from './data/authRepository';
import { INITIAL_SESSION_STATE, reduceSession, type SessionState } from './domain/sessionState';

/**
 * Uygulama genelinde oturum durumunu sağlar. Durum yalnızca Supabase'in
 * `onAuthStateChange` olaylarından güncellenir; eylemler (giriş, çıkış vb.)
 * durumu doğrudan değiştirmez, olay zinciri onu günceller.
 */

interface AuthContextValue extends SessionState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  exchangeCodeForSession: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(INITIAL_SESSION_STATE);

  useEffect(() => {
    return authRepository.subscribeToAuthChanges((event, session) => {
      setState((previous) => reduceSession(previous, event, session));
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn: async (email, password) => {
        await authRepository.signIn(email, password);
      },
      signUp: async (email, password) => {
        const result = await authRepository.signUp(email, password);
        return { requiresEmailConfirmation: result.requiresEmailConfirmation };
      },
      signOut: () => authRepository.signOut(),
      sendPasswordResetEmail: (email) => authRepository.sendPasswordResetEmail(email),
      updatePassword: (newPassword) => authRepository.updatePassword(newPassword),
      exchangeCodeForSession: async (code) => {
        await authRepository.exchangeCodeForSession(code);
      },
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth, AuthProvider içinde kullanılmalı.');
  return context;
}
