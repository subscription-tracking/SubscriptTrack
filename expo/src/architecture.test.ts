/**
 * Mimari koruma testi (Flutter `architecture_test.dart` karşılığı): katman sınırları,
 * döngüsüz feature bağımlılıkları ve dosya boyutu sınırı. İhlal eden bir import
 * veya çok uzun bir dosya eklenirse bu test kırılır.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, normalize, relative, resolve, dirname } from 'path';

const ROOT = resolve(__dirname, '..');
const MAX_LINES = 320;

function listSources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return listSources(full);
    return /\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

const files = [...listSources(join(ROOT, 'app')), ...listSources(join(ROOT, 'src'))].map((file) => ({
  path: relative(ROOT, file).split('\\').join('/'),
  source: readFileSync(file, 'utf8'),
}));

const IMPORT_PATTERN = /(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g;

/** Dosyadaki import yollarını çözümlenmiş (proje köküne göre) biçimde döner. */
function importsOf(file: { path: string; source: string }): string[] {
  const results: string[] = [];
  for (const match of file.source.matchAll(IMPORT_PATTERN)) {
    const specifier = match[1] ?? match[2];
    if (!specifier.startsWith('.')) {
      results.push(specifier);
      continue;
    }
    const target = normalize(join(dirname(file.path), specifier)).split('\\').join('/');
    results.push(target);
  }
  return results;
}

const isSdk = (specifier: string) => specifier.includes('supabase') || specifier.startsWith('react-native');

describe('katman sınırları', () => {
  it('sunum katmanı (app, shared, feature ui) Supabase istemcisini import etmez', () => {
    const guarded = files.filter(
      ({ path }) => path.startsWith('app/') || path.startsWith('src/shared/') || /^src\/features\/[^/]+\/ui\//.test(path),
    );
    const violations = guarded.flatMap((file) =>
      importsOf(file)
        .filter((i) => i.includes('supabase') || i.includes('core/supabase'))
        .map((i) => `${file.path} -> ${i}`),
    );
    expect(violations).toEqual([]);
  });

  it('domain ve saf çekirdek (core/domain, core/time, feature domain) SDK, veri ve UI import etmez', () => {
    const pure = files.filter(
      ({ path }) => path.startsWith('src/core/domain/') || path.startsWith('src/core/time/') || /^src\/features\/[^/]+\/domain\//.test(path),
    );
    const violations = pure.flatMap((file) =>
      importsOf(file)
        .filter((i) => isSdk(i) || /\/(data|ui)\//.test(i) || /(^|\/)app\//.test(i) || /core\/supabase|core\/storage/.test(i))
        .map((i) => `${file.path} -> ${i}`),
    );
    expect(violations).toEqual([]);
  });

  it('veri katmanı ui veya app katmanını import etmez', () => {
    const data = files.filter(({ path }) => /^src\/features\/[^/]+\/data\//.test(path));
    const violations = data.flatMap((file) =>
      importsOf(file)
        .filter((i) => /\/ui\//.test(i) || i.startsWith('app/'))
        .map((i) => `${file.path} -> ${i}`),
    );
    expect(violations).toEqual([]);
  });

  it('core ve shared, feature veri veya UI katmanlarını import etmez', () => {
    const shared = files.filter(({ path }) => path.startsWith('src/core/') || path.startsWith('src/shared/'));
    const violations = shared.flatMap((file) =>
      importsOf(file)
        .filter((i) => /features\/[^/]+\/(data|ui)\//.test(i))
        .map((i) => `${file.path} -> ${i}`),
    );
    expect(violations).toEqual([]);
  });
});

describe('feature bağımlılık grafiği', () => {
  it('katmanlar arasında döngü yoktur', () => {
    const nodeOf = (path: string): string | null => {
      const match = /^src\/features\/([^/]+)\/(domain|data|ui)\//.exec(path);
      return match ? `${match[1]}/${match[2]}` : null;
    };
    const graph = new Map<string, Set<string>>();
    for (const file of files) {
      const from = nodeOf(file.path);
      if (!from) continue;
      for (const i of importsOf(file)) {
        const to = nodeOf(i);
        if (to && to !== from) {
          graph.set(from, (graph.get(from) ?? new Set()).add(to));
        }
      }
    }

    const cycles: string[] = [];
    const done = new Set<string>();
    const stack: string[] = [];
    const visit = (node: string) => {
      if (done.has(node)) return;
      if (stack.includes(node)) {
        cycles.push([...stack.slice(stack.indexOf(node)), node].join(' -> '));
        return;
      }
      stack.push(node);
      for (const next of graph.get(node) ?? []) visit(next);
      stack.pop();
      done.add(node);
    };
    [...graph.keys()].forEach(visit);
    expect(cycles).toEqual([]);
  });
});

describe('dosya boyutu (god-file koruması)', () => {
  it(`hiçbir kaynak dosyası ${MAX_LINES} satırı aşmaz`, () => {
    const tooLong = files
      .map((file) => ({ path: file.path, lines: file.source.split('\n').length }))
      .filter((file) => file.lines > MAX_LINES)
      .map((file) => `${file.path} (${file.lines} satır)`);
    expect(tooLong).toEqual([]);
  });
});
