import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { formatCivilDate, zoneToday, deviceTimeZone } from '../../../core/time/calendar';

/**
 * Dışa aktarma dosyası: CSV'yi uygulama önbelleğine yazar ve paylaşım penceresini açar.
 * Dosya cihazda kalır; sunucuya yüklenmez. Bulut dışa aktarma (`process-export`) canlıda
 * `request_export_idempotent` RPC'si olmadığı için bu sürümde kullanılmaz ([API.md §5](../../../../../docs/reference/API.md)).
 */

export async function shareCsvFile(csv: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Bu cihazda paylaşım kullanılamıyor.');

  const day = formatCivilDate(zoneToday(deviceTimeZone()));
  const file = new File(Paths.cache, `subscriptions-${day}.csv`);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: 'Abonelik verilerini dışa aktar',
  });
}
