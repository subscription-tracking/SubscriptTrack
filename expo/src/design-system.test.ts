/**
 * Tasarım sistemi koruma testi ([docs/expo/DESIGN_SYSTEM.md](../../docs/expo/DESIGN_SYSTEM.md)).
 * Ekranlar ham renk, token dışı boşluk, köşe ve yazı boyutu yazamaz. İhlal eden bir
 * değer eklenirse bu test kırılır.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';

const ROOT = resolve(__dirname, '..');

/** Doküman §5 yazı boyutları: display 36, headline 28, title 22, body 16, label/bodySmall 14, caption 12; Flutter birebirliği için labelSmall 11. */
const ALLOWED_FONT_SIZES = new Set([11, 12, 14, 15, 16, 22, 28, 36]);

function listSources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return listSources(full);
    return /\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

/** Tokenların tanımlandığı dosyalar hariç tüm kaynak dosyalar. */
const files = [...listSources(join(ROOT, 'app')), ...listSources(join(ROOT, 'src'))]
  .filter((file) => !relative(ROOT, file).split('\\').join('/').startsWith('src/shared/design/'))
  .map((file) => ({
    path: relative(ROOT, file).split('\\').join('/'),
    lines: readFileSync(file, 'utf8').split('\n'),
  }));

/** Satır satır arama: `pattern` eşleşen her yer için "dosya:satır" üretir. */
function findLines(pattern: RegExp, ignore: (line: string) => boolean = () => false): string[] {
  return files.flatMap((file) =>
    file.lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => pattern.test(line) && !ignore(line))
      .map(({ line, index }) => `${file.path}:${index + 1}  ${line.trim()}`),
  );
}

describe('renk', () => {
  it('ham hex ve rgba değeri yalnızca tokens.ts içinde tanımlanır', () => {
    expect(findLines(/#[0-9A-Fa-f]{3,8}\b|rgba?\(/)).toEqual([]);
  });
});

describe('yazı', () => {
  it('yalnızca tasarım belgesindeki yazı boyutları kullanılır', () => {
    const violations = findLines(/fontSize:\s*\d+/).filter((entry) => {
      const size = Number(/fontSize:\s*(\d+)/.exec(entry)?.[1]);
      return !ALLOWED_FONT_SIZES.has(size);
    });
    expect(violations).toEqual([]);
  });

  it('ekranlar kalınlık yazmaz; 800 hiçbir yerde kullanılmaz', () => {
    expect(findLines(/fontWeight:\s*'800'/)).toEqual([]);
  });

  it('ekranlar fontSize ve fontWeight yazmaz, yazı rolü kullanır', () => {
    expect(findLines(/fontWeight:\s*'\d+'/)).toEqual([]);
  });
});

describe('boşluk ve köşe', () => {
  it('Spacer yalnızca token alır, ham sayı kabul etmez', () => {
    expect(findLines(/<Spacer size=\{\d+\}/)).toEqual([]);
  });

  it('padding, margin ve gap değerleri ham sayı olamaz', () => {
    expect(findLines(/\b(padding|margin|gap)\w*:\s*\d+/)).toEqual([]);
  });

  it('köşe yarıçapı ham sayı olamaz', () => {
    expect(findLines(/borderRadius:\s*\d+/)).toEqual([]);
  });
});
