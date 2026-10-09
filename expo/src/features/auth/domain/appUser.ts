/**
 * Uygulamanın kullandığı kullanıcı biçimi. Domain katmanı Supabase SDK tipine
 * bağımlı değildir; veri katmanı SDK kullanıcısını bu yapısal girdiye çevirir.
 */
export interface AppUser {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

/** Yalnızca gereken alanlar; Supabase `User` nesnesi bunu yapısal olarak karşılar. */
export interface SessionUserInput {
  id: string;
  email?: string | null;
  created_at: string;
  user_metadata?: Record<string, unknown> | null;
}

export function toAppUser(user: SessionUserInput): AppUser {
  const displayName = user.user_metadata?.display_name;
  return {
    id: user.id,
    email: user.email ?? '',
    displayName: typeof displayName === 'string' ? displayName : null,
    createdAt: user.created_at,
  };
}
