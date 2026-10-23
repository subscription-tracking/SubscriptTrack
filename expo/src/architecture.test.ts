/**
 * Mimari koruma testi (Flutter `architecture_test.dart` karşılığı): katman sınırları,
 * döngüsüz feature bağımlılıkları ve dosya boyutu sınırı. İhlal eden bir import
 * veya çok uzun bir dosya eklenirse bu test kırılır.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';
import ts from 'typescript';

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

const configPath = ts.findConfigFile(ROOT, ts.sys.fileExists, 'tsconfig.json')!;
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const options = ts.parseJsonConfigFileContent(config.config, ts.sys, ROOT).options;

function importsOf(file: { path: string; source: string }): string[] {
  const results: string[] = [];
  const absolute = resolve(ROOT, file.path);
  const ast = ts.createSourceFile(absolute, file.source, ts.ScriptTarget.Latest, true);
  const add = (specifier: string) => {
    const target = ts.resolveModuleName(specifier, absolute, options, ts.sys).resolvedModule;
    results.push(target && !target.isExternalLibraryImport
      ? relative(ROOT, target.resolvedFileName).split('\\').join('/').replace(/\.tsx?$/, '')
      : specifier);
  };
  const visit = (node: ts.Node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) add(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(ast) === 'require')
      && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) add(node.arguments[0].text);
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return results;
}
// Saf biçimlendirme ve palette verileri mevcut domain sunum modellerinin bilinçli istisnalarıdır.
const pureExceptions = new Set(['src/core/format/money', 'src/core/format/date', 'src/shared/design/palette', 'src/shared/design/servicePalette']);
const isSdk = (specifier: string) => !pureExceptions.has(specifier) && !specifier.startsWith('src/core/domain/') && !specifier.startsWith('src/core/time/') && !/^src\/features\/[^/]+\/domain\//.test(specifier);

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
      ({ path }) => path.startsWith('src/core/domain/') || path.startsWith('src/core/time/') || /^src\/features\/[^/]+\/domain\//.test(path) || pureExceptions.has(path.replace(/\.tsx?$/, '')),
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

  it('koordinatörler SDK veya somut I/O implementasyonlarını import etmez', () => {
    const coordinators = files.filter(({ path }) => /Coordinator\.ts$/.test(path));
    const allowed = (path: string) => /^src\/features\/[^/]+\/domain\//.test(path) || /^src\/core\/(domain|time|errors|async)\//.test(path);
    const violations = coordinators.flatMap((file) => importsOf(file).filter((path) => !allowed(path)).map((path) => `${file.path} -> ${path}`));
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
      const key = path.replace(/\.tsx?$/, '');
      return files.some((file) => file.path.replace(/\.tsx?$/, '') === key) ? key : null;
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
