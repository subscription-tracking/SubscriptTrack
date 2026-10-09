import {
  FALLBACK_SERVICE_PRESETS,
  matchServicePresets,
  presetFromCatalogRow,
  resolveServicePresets,
} from './servicePresets';

describe('presetFromCatalogRow', () => {
  it('ad ve kategoriyi okur; tanınmayan kategori other olur', () => {
    expect(presetFromCatalogRow({ name: ' Netflix ', category: 'streaming' })).toEqual({ name: 'Netflix', category: 'streaming' });
    expect(presetFromCatalogRow({ name: 'X', category: 'uzay' })).toEqual({ name: 'X', category: 'other' });
  });

  it('boş adı reddeder', () => {
    expect(presetFromCatalogRow({ name: '   ', category: 'music' })).toBeNull();
  });
});

describe('resolveServicePresets', () => {
  it('sunucu listesi boşsa yedek listeyi kullanır', () => {
    expect(resolveServicePresets([])).toBe(FALLBACK_SERVICE_PRESETS);
    expect(resolveServicePresets(null)).toBe(FALLBACK_SERVICE_PRESETS);
  });

  it('sunucu listesi doluysa onu kullanır', () => {
    const remote = [{ name: 'Foo', category: 'other' as const }];
    expect(resolveServicePresets(remote)).toBe(remote);
  });
});

describe('matchServicePresets', () => {
  it('boş sorguda öneri göstermez', () => {
    expect(matchServicePresets(FALLBACK_SERVICE_PRESETS, '   ')).toEqual([]);
  });

  it('büyük/küçük harf duyarsız içerir eşleşir', () => {
    expect(matchServicePresets(FALLBACK_SERVICE_PRESETS, 'NETF').map((p) => p.name)).toEqual(['Netflix']);
  });

  it('Türkçe büyük harfte de eşleşir', () => {
    expect(matchServicePresets(FALLBACK_SERVICE_PRESETS, 'EXX').map((p) => p.name)).toEqual(['Exxen']);
  });

  it('tam eşleşen adı tekrar önermez', () => {
    expect(matchServicePresets(FALLBACK_SERVICE_PRESETS, 'Netflix')).toEqual([]);
  });

  it('en çok limit kadar öneri döner', () => {
    const presets = [
      { name: 'Apple A', category: 'other' as const },
      { name: 'Apple B', category: 'other' as const },
      { name: 'Apple C', category: 'other' as const },
    ];
    expect(matchServicePresets(presets, 'apple', 2)).toHaveLength(2);
  });
});
