import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { formatCivilDate, zoneToday } from '../../../core/time/calendar';

/**
 * Dışa aktarma dosyası: CSV'yi uygulama önbelleğine yazar ve paylaşım penceresini açar.
 * Dosya cihazda kalır; sunucuya yüklenmez. Bulut dışa aktarma ayrı bir akıştır;
 * canlı RPC/Function ve imzalı indirme test hesabında doğrulandı, cihaz paylaşımı açık
 * ([API.md §5](../../../../../docs/reference/API.md)).
 */

export async function shareCsvFile(csv: string, timeZone: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Bu cihazda paylaşım kullanılamıyor.');

  const day = formatCivilDate(zoneToday(timeZone));
  const file = new File(Paths.cache, `subscriptions-${day}.csv`);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);

  try {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: 'Abonelik verilerini dışa aktar',
    });
  } finally {
    // Paylaşım bitti (tamamlandı, iptal edildi veya hata verdi): önbellekteki kişisel veri kopyası bırakılmaz.
    try { if (file.exists) file.delete(); } catch { /* Silinemezse önbellek temizliği işletim sistemine kalır. */ }
  }
}
