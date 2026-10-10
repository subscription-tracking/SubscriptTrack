import { randomUUID } from 'expo-crypto';

import { supabase } from '../../../core/supabase/client';

/**
 * Bulut dışa aktarma (Flutter `SupabaseExportRepository` ile aynı sözleşme): önce `request_export_idempotent`
 * RPC'siyle iş oluşturulur, sonra `process-export` CSV üretip özel `exports` bucket'ına yükler ve 1 saatlik
 * imzalı bağlantı döner ([API.md §5](../../../../../docs/reference/API.md)).
 */

export class CloudExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CloudExportError';
  }
}

export async function requestCloudExport(): Promise<{ downloadUrl: string; expiresAt: string | null }> {
  const { data: requested, error: requestError } = await supabase.rpc('request_export_idempotent', {
    p_idempotency_key: randomUUID(),
  });
  if (requestError) throw new CloudExportError('Dışa aktarma başlatılamadı. Bağlantını kontrol edip tekrar dene.');

  const exportId = (requested as { id?: unknown } | null)?.id;
  if (typeof exportId !== 'string') throw new CloudExportError('Dışa aktarma kaydı oluşturulamadı.');

  const { data, error } = await supabase.functions.invoke<{ download_url?: string; expires_at?: string }>('process-export', {
    body: { export_id: exportId },
  });
  if (error || !data?.download_url) throw new CloudExportError('Dışa aktarma dosyası hazırlanamadı. Tekrar dene.');
  return { downloadUrl: data.download_url, expiresAt: data.expires_at ?? null };
}
