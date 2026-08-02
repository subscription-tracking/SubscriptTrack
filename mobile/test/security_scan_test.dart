import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// S12 güvenlik tarama testleri.
///
/// Kaynak kodda hardcoded secret, API key veya Supabase URL
/// olmadığını doğrular. Tüm credential'lar --dart-define ile
/// inject edilmeli (bkz. app_environment.dart).
void main() {
  group('Güvenlik — hardcoded secret taraması (S12)', () {
    late List<File> dartFiles;

    setUpAll(() {
      // Test, projenin kökünden çalışır.
      final libDir = Directory('lib');
      dartFiles = libDir
          .listSync(recursive: true)
          .whereType<File>()
          .where((f) => f.path.endsWith('.dart'))
          .toList();
      expect(dartFiles, isNotEmpty, reason: 'lib/ dizini bulunamadı');
    });

    test('supabase URL doğrudan tanımlanmamış', () {
      final pattern = RegExp(
          r'https://[a-z0-9]+\.supabase\.co',
          caseSensitive: false);
      final hits = <String>[];
      for (final f in dartFiles) {
        final content = f.readAsStringSync();
        if (pattern.hasMatch(content)) hits.add(f.path);
      }
      expect(hits, isEmpty,
          reason:
              'Supabase URL şu dosyalarda hardcoded: $hits\n'
              'Bunları --dart-define ile inject et.');
    });

    test('supabase anon key doğrudan tanımlanmamış', () {
      // Supabase anon key formatı: eyJ... (JWT başlangıcı, 100+ karakter)
      final pattern = RegExp(r'eyJ[A-Za-z0-9_-]{50,}');
      final hits = <String>[];
      for (final f in dartFiles) {
        final content = f.readAsStringSync();
        if (pattern.hasMatch(content)) hits.add(f.path);
      }
      expect(hits, isEmpty,
          reason:
              'JWT/anon key şu dosyalarda hardcoded: $hits\n'
              'Bunları --dart-define ile inject et.');
    });

    test('API base URL kodda string literal değil', () {
      // Gerçek API URL'leri https://api.{domain}.com şeklinde görünmeli
      // ama bu test sadece ham IP/port kombinasyonlarını yakalar.
      final pattern = RegExp(r'https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}');
      final hits = <String>[];
      for (final f in dartFiles) {
        final content = f.readAsStringSync();
        if (pattern.hasMatch(content)) hits.add(f.path);
      }
      expect(hits, isEmpty,
          reason:
              'Hardcoded IP adresi şu dosyalarda bulundu: $hits\n'
              'API URL\'lerini --dart-define ile inject et.');
    });

    test('service role key anahtar sözcüğü kaynak kodda yok', () {
      // Supabase service_role key yanlışlıkla commit edilmesin
      final pattern = RegExp(r'service_role', caseSensitive: false);
      final hits = <String>[];
      for (final f in dartFiles) {
        final content = f.readAsStringSync();
        if (pattern.hasMatch(content)) hits.add(f.path);
      }
      expect(hits, isEmpty,
          reason:
              'service_role referansı şu dosyalarda bulundu: $hits\n'
              'Bu key hiçbir zaman client\'a gömülmemeli.');
    });
  });
}
