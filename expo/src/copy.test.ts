import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Kullanıcıya görünen metin denetimi: belirli ifadeler ekranlarda ve ortak bileşenlerde bulunmaz.
 * Yorumlar ve test dosyaları taranmaz; yalnızca kod ve dize değişmezleri incelenir.
 */
const ROOT = join(__dirname, '..');
const FORBIDDEN: { name: string; pattern: RegExp }[] = [
  { name: 'Geçti', pattern: /(^|[^\p{L}])Geçti([^\p{L}]|$)/u },
  { name: 'sunucu güncellemesini bekliyor', pattern: /sunucu güncellemesini bekliyor/i },
  { name: 'yeniden açıldığında denenecek', pattern: /yeniden açıldığında denenecek/i },
  { name: 'kapasiteyi kontrol et', pattern: /kapasiteyi kontrol et/i },
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === 'node_modules') return [];
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

/** Dize ve şablon değişmezlerini koruyarak satır ve blok yorumlarını siler. */
function stripComments(code: string): string {
  let out = '';
  let index = 0;
  let quote: string | null = null;
  while (index < code.length) {
    const ch = code[index];
    const next = code[index + 1];
    if (quote) {
      out += ch;
      if (ch === '\\') {
        out += next ?? '';
        index += 2;
        continue;
      }
      if (ch === quote) quote = null;
      index += 1;
      continue;
    }
    if (ch === '/' && next === '/') {
      while (index < code.length && code[index] !== '\n') index += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      const end = code.indexOf('*/', index + 2);
      index = end < 0 ? code.length : end + 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') quote = ch;
    out += ch;
    index += 1;
  }
  return out;
}

describe('kullanıcı metinleri', () => {
  const files = [...sourceFiles(join(ROOT, 'src')), ...sourceFiles(join(ROOT, 'app'))];

  it.each(FORBIDDEN)('"$name" ifadesi kullanıcıya görünen metinde bulunmaz', ({ pattern }) => {
    const violations = files
      .filter((file) => pattern.test(stripComments(readFileSync(file, 'utf8'))))
      .map((file) => relative(ROOT, file).split('\\').join('/'));
    expect(violations).toEqual([]);
  });
});
