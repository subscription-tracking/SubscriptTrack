import type { SubscriptionCategory } from './subscription';
import { CATEGORY_PALETTE, SERVICE_COLORS } from '../../../shared/design/servicePalette';

/**
 * Hizmet kimliği eşlemesi (Flutter `ServiceIdentity` ile aynı). Bilinen marka adı için marka ikonu,
 * bilinen ama marka ikonu olmayan hizmet için Material yedeği, diğerleri için baş harf.
 *
 * Renkler: Flutter `ServiceIdentity` ile birebir aynı hex değerleri. Kategori yedek renkleri
 * `software` için tema birincil rengi, `other` için durum "muted" rengidir (ikisi de tokenlardan gelir).
 */

export type ServiceMark =
  | { kind: 'brand'; icon: BrandIconName; color: string }
  | { kind: 'material'; icon: MaterialFallbackName; color: string }
  | { kind: 'initial'; initial: string; color: string | null };

/** FontAwesome 6 marka ikonu adları (Flutter `FontAwesomeIcons.*`). */
export type BrandIconName =
  | 'amazon'
  | 'apple'
  | 'youtube'
  | 'spotify'
  | 'itunes'
  | 'deezer'
  | 'jira'
  | 'slack'
  | 'figma'
  | 'google'
  | 'dropbox'
  | 'microsoft'
  | 'github'
  | 'gitlab'
  | 'xbox'
  | 'playstation'
  | 'strava';

/** Material ikon adları (Flutter yedek `Icons.*`). */
export type MaterialFallbackName =
  | 'movie'
  | 'videocam'
  | 'live-tv'
  | 'play-arrow'
  | 'movie-creation'
  | 'tv'
  | 'theaters'
  | 'queue-music'
  | 'chat-bubble-outline'
  | 'article'
  | 'hub'
  | 'electric-bolt'
  | 'image'
  | 'design-services'
  | 'brush'
  | 'rocket-launch'
  | 'cloud'
  | 'sports-esports'
  | 'monitor-heart'
  | 'security'
  | 'vpn-lock'
  | 'lock'
  | 'password'
  | 'shield';

const BRAND: Record<string, { icon: BrandIconName; color: string }> = {
  'amazon prime': { icon: 'amazon', color: SERVICE_COLORS['amazon prime'] },
  'prime video': { icon: 'amazon', color: SERVICE_COLORS['prime video'] },
  'apple tv': { icon: 'apple', color: SERVICE_COLORS['apple tv'] },
  'apple tv+': { icon: 'apple', color: SERVICE_COLORS['apple tv+'] },
  youtube: { icon: 'youtube', color: SERVICE_COLORS['youtube'] },
  'youtube premium': { icon: 'youtube', color: SERVICE_COLORS['youtube premium'] },
  spotify: { icon: 'spotify', color: SERVICE_COLORS['spotify'] },
  'apple music': { icon: 'itunes', color: SERVICE_COLORS['apple music'] },
  'youtube music': { icon: 'youtube', color: SERVICE_COLORS['youtube music'] },
  deezer: { icon: 'deezer', color: SERVICE_COLORS['deezer'] },
  jira: { icon: 'jira', color: SERVICE_COLORS['jira'] },
  slack: { icon: 'slack', color: SERVICE_COLORS['slack'] },
  figma: { icon: 'figma', color: SERVICE_COLORS['figma'] },
  'google one': { icon: 'google', color: SERVICE_COLORS['google one'] },
  dropbox: { icon: 'dropbox', color: SERVICE_COLORS['dropbox'] },
  onedrive: { icon: 'microsoft', color: SERVICE_COLORS['onedrive'] },
  icloud: { icon: 'apple', color: SERVICE_COLORS['icloud'] },
  github: { icon: 'github', color: SERVICE_COLORS['github'] },
  gitlab: { icon: 'gitlab', color: SERVICE_COLORS['gitlab'] },
  'xbox game pass': { icon: 'xbox', color: SERVICE_COLORS['xbox game pass'] },
  'playstation plus': { icon: 'playstation', color: SERVICE_COLORS['playstation plus'] },
  strava: { icon: 'strava', color: SERVICE_COLORS['strava'] },
};

const MATERIAL: Record<string, { icon: MaterialFallbackName; color: string }> = {
  netflix: { icon: 'movie', color: SERVICE_COLORS['netflix'] },
  'disney+': { icon: 'videocam', color: SERVICE_COLORS['disney+'] },
  disney: { icon: 'videocam', color: SERVICE_COLORS['disney'] },
  'hbo max': { icon: 'live-tv', color: SERVICE_COLORS['hbo max'] },
  hbo: { icon: 'live-tv', color: SERVICE_COLORS['hbo'] },
  max: { icon: 'live-tv', color: SERVICE_COLORS['max'] },
  exxen: { icon: 'play-arrow', color: SERVICE_COLORS['exxen'] },
  gain: { icon: 'movie-creation', color: SERVICE_COLORS['gain'] },
  blutv: { icon: 'tv', color: SERVICE_COLORS['blutv'] },
  mubi: { icon: 'theaters', color: SERVICE_COLORS['mubi'] },
  tidal: { icon: 'queue-music', color: SERVICE_COLORS['tidal'] },
  chatgpt: { icon: 'chat-bubble-outline', color: SERVICE_COLORS['chatgpt'] },
  openai: { icon: 'chat-bubble-outline', color: SERVICE_COLORS['openai'] },
  claude: { icon: 'chat-bubble-outline', color: SERVICE_COLORS['claude'] },
  notion: { icon: 'article', color: SERVICE_COLORS['notion'] },
  obsidian: { icon: 'hub', color: SERVICE_COLORS['obsidian'] },
  linear: { icon: 'electric-bolt', color: SERVICE_COLORS['linear'] },
  midjourney: { icon: 'image', color: SERVICE_COLORS['midjourney'] },
  adobe: { icon: 'design-services', color: SERVICE_COLORS['adobe'] },
  canva: { icon: 'brush', color: SERVICE_COLORS['canva'] },
  sketch: { icon: 'design-services', color: SERVICE_COLORS['sketch'] },
  vercel: { icon: 'rocket-launch', color: SERVICE_COLORS['vercel'] },
  netlify: { icon: 'cloud', color: SERVICE_COLORS['netlify'] },
  'ea play': { icon: 'sports-esports', color: SERVICE_COLORS['ea play'] },
  'nintendo switch online': { icon: 'sports-esports', color: SERVICE_COLORS['nintendo switch online'] },
  myfitnesspal: { icon: 'monitor-heart', color: SERVICE_COLORS['myfitnesspal'] },
  nordvpn: { icon: 'security', color: SERVICE_COLORS['nordvpn'] },
  expressvpn: { icon: 'vpn-lock', color: SERVICE_COLORS['expressvpn'] },
  '1password': { icon: 'lock', color: SERVICE_COLORS['1password'] },
  lastpass: { icon: 'password', color: SERVICE_COLORS['lastpass'] },
  bitwarden: { icon: 'shield', color: SERVICE_COLORS['bitwarden'] },
};

const CATEGORY_COLORS: Partial<Record<SubscriptionCategory, string>> = {
  streaming: CATEGORY_PALETTE.streaming,
  music: CATEGORY_PALETTE.music,
  gaming: CATEGORY_PALETTE.gaming,
  cloud: CATEGORY_PALETTE.cloud,
  fitness: CATEGORY_PALETTE.fitness,
  news: CATEGORY_PALETTE.news,
  food: CATEGORY_PALETTE.food,
  education: CATEGORY_PALETTE.education,
};

/** Logosu olmayan hizmetler için ada göre sabit renk: aynı ad her zaman aynı tonu alır, liste tek düze görünmez. */
const MONOGRAM_COLORS = Object.values(CATEGORY_PALETTE);
export function monogramColor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return MONOGRAM_COLORS[hash % MONOGRAM_COLORS.length];
}

/** Kategori rengi. */
export function categoryColor(category: SubscriptionCategory): string | null {
  return CATEGORY_COLORS[category] ?? null;
}

/** Ad (büyük/küçük harf duyarsız, kırpılmış) için hizmet işareti. */
export function serviceMark(name: string, category: SubscriptionCategory): ServiceMark {
  const key = name.trim().toLowerCase();
  const brand = BRAND[key];
  if (brand) return { kind: 'brand', icon: brand.icon, color: brand.color };
  const material = MATERIAL[key];
  if (material) return { kind: 'material', icon: material.icon, color: material.color };
  // Flutter `toUpperCase()` (yerelden bağımsız) ile aynı: "i" → "I".
  const initial = key.length > 0 ? name.trim()[0].toUpperCase() : '?';
  return { kind: 'initial', initial, color: categoryColor(category) ?? monogramColor(key) };
}
