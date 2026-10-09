import { supabase } from '../../../core/supabase/client';
import { type ServicePreset, presetFromCatalogRow } from '../domain/servicePresets';

/**
 * Servis kataloğu (`support-catalog` GET, [API.md](../../../../../docs/reference/API.md)).
 * Hata fırlatır; çağıran yedek listeye düşer.
 */
export async function fetchServiceCatalog(): Promise<ServicePreset[]> {
  const { data, error } = await supabase.functions.invoke<{ services?: { name: string; category: string }[] }>(
    'support-catalog',
    { method: 'GET' },
  );
  if (error) throw error;
  return (data?.services ?? [])
    .map(presetFromCatalogRow)
    .filter((preset): preset is ServicePreset => preset !== null);
}
