import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/core/storage/secure_supabase_storage.dart';

/// Denetim F-16: PKCE verifier güvenli depoda, SharedPreferences'ta değil.
void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  test('verifier yazılır, okunur, silinir ve SharedPreferences\'a düşmez',
      () async {
    const storage = SecurePkceStorage();
    await storage.setItem(key: 'sb-x-code-verifier', value: 'v123');
    expect(await storage.getItem(key: 'sb-x-code-verifier'), 'v123');

    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getKeys(), isEmpty);
    expect(
        await const FlutterSecureStorage().read(key: 'pkce_sb-x-code-verifier'),
        'v123');

    await storage.removeItem(key: 'sb-x-code-verifier');
    expect(await storage.getItem(key: 'sb-x-code-verifier'), isNull);
  });
}
