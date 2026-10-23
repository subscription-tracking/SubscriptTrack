import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '../../../core/supabase/client';

/**
 * Hesap silme isteği (`delete-account`). Sunucu yakın giriş ister: oturum açma zamanı 5 dakikadan
 * eskiyse 403 döner; bu yüzden istemci silmeden önce parolayla yeniden giriş yapar.
 * Silme geri alınamaz; sunucu Storage nesnelerini de siler ([API.md §5](../../../../../docs/reference/API.md)).
 */

export class DeleteAccountError extends Error {
  constructor(
    message: string,
    readonly recentLoginRequired: boolean,
  ) {
    super(message);
    this.name = 'DeleteAccountError';
  }
}

export async function requestAccountDeletion(): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ success?: boolean }>('delete-account', { method: 'POST' });
  if (!error && data?.success === true) return;
  if (!error) throw new DeleteAccountError('Hesap silinemedi. Bağlantını kontrol edip tekrar dene.', false);
  // Sunucunun HTTP durumu yalnız FunctionsHttpError bağlamındadır; diğer hatalar genel mesaja düşer.
  if (error instanceof FunctionsHttpError && error.context.status === 403) {
    throw new DeleteAccountError('Güvenlik için yeniden giriş yapman gerekiyor. Şifreni tekrar girip dene.', true);
  }
  throw new DeleteAccountError('Hesap silinemedi. Bağlantını kontrol edip tekrar dene.', false);
}
