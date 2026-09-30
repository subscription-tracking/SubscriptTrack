// Mimari koruma testi: katman sınırları ve dosya boyutu kuralları.
// Kural ihlal eden bir import/dosya eklenirse bu test kırılır.
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// `lib/` altındaki tüm Dart dosyaları (POSIX ayraçlı göreli yol → içerik).
Map<String, String> _libSources() {
  final root = Directory('lib');
  return {
    for (final entity in root.listSync(recursive: true))
      if (entity is File && entity.path.endsWith('.dart'))
        entity.path.replaceAll('\\', '/'): entity.readAsStringSync(),
  };
}

final _importPattern =
    RegExp(r'''^(?:import|export)\s+['"]([^'"]+)['"]''', multiLine: true);

Iterable<String> _imports(String source) =>
    _importPattern.allMatches(source).map((m) => m.group(1)!);

bool _inLayer(String path, String layer) =>
    RegExp('^lib/features/[^/]+/$layer/').hasMatch(path);

void main() {
  final sources = _libSources();

  test('presentation, shared ve app katmanları supabase_flutter import etmez',
      () {
    final violations = <String>[];
    sources.forEach((path, source) {
      final guarded = _inLayer(path, 'presentation') ||
          path.startsWith('lib/shared/') ||
          path.startsWith('lib/app/');
      if (!guarded) return;
      if (_imports(source).any((i) => i.contains('supabase_flutter'))) {
        violations.add(path);
      }
    });
    expect(violations, isEmpty, reason: violations.join('\n'));
  });

  test('domain katmanı data, presentation veya supabase import etmez', () {
    final violations = <String>[];
    sources.forEach((path, source) {
      if (!_inLayer(path, 'domain') && !path.startsWith('lib/core/domain/')) {
        return;
      }
      for (final import in _imports(source)) {
        if (import.contains('/data/') ||
            import.contains('/presentation/') ||
            import.contains('supabase_flutter')) {
          violations.add('$path -> $import');
        }
      }
    });
    expect(violations, isEmpty, reason: violations.join('\n'));
  });

  test('data katmanı presentation import etmez', () {
    final violations = <String>[];
    sources.forEach((path, source) {
      if (!_inLayer(path, 'data')) return;
      for (final import in _imports(source)) {
        if (import.contains('/presentation/')) {
          violations.add('$path -> $import');
        }
      }
    });
    expect(violations, isEmpty, reason: violations.join('\n'));
  });

  test('core ve shared, feature\'ların yalnızca domain katmanını import eder',
      () {
    final violations = <String>[];
    sources.forEach((path, source) {
      if (!path.startsWith('lib/core/') && !path.startsWith('lib/shared/')) {
        return;
      }
      for (final import in _imports(source)) {
        final match =
            RegExp(r'features/[^/]+/(data|presentation)/').hasMatch(import);
        if (match) violations.add('$path -> $import');
      }
    });
    expect(violations, isEmpty, reason: violations.join('\n'));
  });

  test('feature/katman bağımlılık grafiği döngüsüzdür', () {
    // Düğüm: "<feature>/<katman>" (ör. subscriptions/presentation).
    String? node(String path) {
      final m = RegExp(r'^lib/features/([^/]+)/(domain|data|presentation)/')
          .firstMatch(path);
      return m == null ? null : '${m.group(1)}/${m.group(2)}';
    }

    final graph = <String, Set<String>>{};
    sources.forEach((path, source) {
      final from = node(path);
      if (from == null) return;
      for (final import in _imports(source)) {
        if (import.startsWith('dart:') || import.startsWith('package:')) {
          continue;
        }
        final resolved = Uri.parse(path).resolve(import).path;
        final to = node(resolved);
        if (to != null && to != from) {
          graph.putIfAbsent(from, () => {}).add(to);
        }
      }
    });

    final visiting = <String>[];
    final done = <String>{};
    final cycles = <String>[];
    void visit(String n) {
      if (done.contains(n)) return;
      if (visiting.contains(n)) {
        cycles.add([...visiting.skipWhile((x) => x != n), n].join(' -> '));
        return;
      }
      visiting.add(n);
      for (final next in graph[n] ?? const <String>{}) {
        visit(next);
      }
      visiting.removeLast();
      done.add(n);
    }

    graph.keys.toList().forEach(visit);
    expect(cycles, isEmpty, reason: cycles.join('\n'));
  });

  test('sayfa geçişleri go_router ile yapılır (Navigator.push yok)', () {
    final violations = <String>[];
    sources.forEach((path, source) {
      if (source.contains('Navigator.push') ||
          source.contains('MaterialPageRoute')) {
        violations.add(path);
      }
    });
    expect(violations, isEmpty, reason: violations.join('\n'));
  });

  test('hiçbir lib dosyası 320 satırı aşmaz (god-file koruması)', () {
    const limit = 320;
    final tooLong = <String>[];
    sources.forEach((path, source) {
      final lines = '\n'.allMatches(source).length + 1;
      if (lines > limit) tooLong.add('$path ($lines satır)');
    });
    expect(tooLong, isEmpty, reason: tooLong.join('\n'));
  });
}
