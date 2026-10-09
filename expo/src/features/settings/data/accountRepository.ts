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
  const { error } = await supabase.functions.invoke<{ success?: boolean }>('delete-account', { method: 'POST' });
  if (!error) return;
  const status = (error as { context?: { status?: number } }).context?.status;
  if (status === 403) {
    throw new DeleteAccountError('Güvenlik için yeniden giriş yapman gerekiyor. Şifreni tekrar girip dene.', true);
  }
  throw new DeleteAccountError('Hesap silinemedi. Bağlantını kontrol edip tekrar dene.', false);
}
