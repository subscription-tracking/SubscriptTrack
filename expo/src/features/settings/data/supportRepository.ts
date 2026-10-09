import { supabase } from '../../../core/supabase/client';

/**
 * Destek kaydı (`support-catalog` POST → `support_tickets`). Mesaj 1–2000 karakter; kategori en çok 60.
 * Kayıt yalnızca kullanıcının kendi adına oluşturulur (RLS + Edge Function kimlik doğrulaması).
 */

export async function createSupportTicket(input: { message: string; category: string }): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ id?: string }>('support-catalog', {
    method: 'POST',
    body: { message: input.message.trim(), category: input.category },
  });
  if (error || !data?.id) throw new Error('Destek kaydı oluşturulamadı. Lütfen tekrar dene.');
  return data.id;
}
