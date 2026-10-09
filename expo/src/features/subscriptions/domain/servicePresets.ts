import { SUBSCRIPTION_CATEGORIES, type SubscriptionCategory } from './subscription';

/**
 * Form servis önerileri. Kaynak: `support-catalog` (sunucu) ve bu yedek liste; sunucu
 * ulaşılamazsa yedek kullanılır (Flutter `popularSubscriptionPresets` ile aynı kayıtlar).
 * I/O yoktur.
 */

export interface ServicePreset {
  name: string;
  category: SubscriptionCategory;
}

export const FALLBACK_SERVICE_PRESETS: readonly ServicePreset[] = [
  { name: 'Netflix', category: 'streaming' },
  { name: 'Disney+', category: 'streaming' },
  { name: 'YouTube Premium', category: 'streaming' },
  { name: 'BluTV', category: 'streaming' },
  { name: 'Exxen', category: 'streaming' },
  { name: 'Amazon Prime', category: 'streaming' },
  { name: 'Apple TV+', category: 'streaming' },
  { name: 'MUBI', category: 'streaming' },
  { name: 'Spotify', category: 'music' },
  { name: 'Apple Music', category: 'music' },
  { name: 'YouTube Music', category: 'music' },
  { name: 'Tidal', category: 'music' },
  { name: 'Deezer', category: 'music' },
  { name: 'ChatGPT', category: 'software' },
  { name: 'Claude', category: 'software' },
  { name: 'Notion', category: 'software' },
  { name: 'Slack', category: 'software' },
  { name: 'Figma', category: 'software' },
  { name: 'Adobe', category: 'software' },
  { name: 'Canva', category: 'software' },
  { name: 'iCloud', category: 'cloud' },
  { name: 'Google One', category: 'cloud' },
  { name: 'Dropbox', category: 'cloud' },
  { name: 'Xbox Game Pass', category: 'gaming' },
  { name: 'PlayStation Plus', category: 'gaming' },
  { name: 'EA Play', category: 'gaming' },
];

/** Sunucu satırını öneriye çevirir. Tanınmayan kategori `other` olur. */
export function presetFromCatalogRow(row: { name: string; category: string }): ServicePreset | null {
  const name = row.name.trim();
  if (!name) return null;
  const category = (SUBSCRIPTION_CATEGORIES as readonly string[]).includes(row.category)
    ? (row.category as SubscriptionCategory)
    : 'other';
  return { name, category };
}

/** Sunucu listesi boşsa yedek listeyi kullanır. */
export function resolveServicePresets(remote: readonly ServicePreset[] | null | undefined): readonly ServicePreset[] {
  return remote && remote.length > 0 ? remote : FALLBACK_SERVICE_PRESETS;
}

/**
 * Yazılan metne göre öneriler: ad içinde geçen, tam eşleşme dışında. Büyük/küçük harf
 * ve Türkçe karakterler `tr-TR` ile karşılaştırılır. En çok `limit` öneri.
 */
export function matchServicePresets(
  presets: readonly ServicePreset[],
  query: string,
  limit = 6,
): ServicePreset[] {
  const needle = query.trim().toLocaleLowerCase('tr-TR');
  if (needle.length === 0) return [];
  return presets
    .filter((preset) => {
      const name = preset.name.toLocaleLowerCase('tr-TR');
      return name !== needle && name.includes(needle);
    })
    .slice(0, limit);
}
