import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:subscript_track/core/errors/app_exception.dart';
import 'package:subscript_track/core/network/support_catalog_api.dart';
import 'package:subscript_track/features/notifications/data/notification_repository.dart';
import 'package:subscript_track/features/notifications/domain/app_notification.dart';
import 'package:subscript_track/features/settings/data/payment_methods_api.dart';
import 'package:subscript_track/features/settings/data/supabase_export_repository.dart';

import '../../support/mock_supabase.dart';

typedef _Handler = http.Response Function(RecordedRequest request);

void main() {
  late MockSupabase supabase;
  late _Handler handler;

  setUp(() {
    handler = (r) => MockSupabase.ok({});
    supabase = MockSupabase((r) => handler(r));
  });
  tearDown(() => supabase.dispose());

  group('PaymentMethodsApi', () {
    test('load: Edge Function GET ile etiketleri okur', () async {
      handler = (r) => MockSupabase.ok({
            'methods': ['Nakit', 'Kart', 42, null]
          });
      final methods = await PaymentMethodsApi(client: supabase.client).load();

      final request = supabase.requests.single;
      expect(request.method, 'GET');
      expect(request.path, '/functions/v1/payment-methods');
      expect(methods, ['Nakit', 'Kart'], reason: 'yalnızca metinler alınır');
    });

    test('load: geçersiz yanıt biçimi hata verir', () async {
      handler = (r) => MockSupabase.ok({'methods': 'yanlış'});
      await expectLater(
        PaymentMethodsApi(client: supabase.client).load(),
        throwsA(isA<PaymentMethodsApiException>()
            .having((e) => e.message, 'message', 'Geçersiz sunucu yanıtı.')),
      );
    });

    test('load: sunucu hatasında sunucunun mesajı iletilir', () async {
      handler =
          (r) => MockSupabase.ok({'error': 'Oturum süresi doldu'}, status: 401);
      await expectLater(
        PaymentMethodsApi(client: supabase.client).load(),
        throwsA(isA<PaymentMethodsApiException>()
            .having((e) => e.message, 'message', 'Oturum süresi doldu')),
      );
    });

    test('replace: PUT ile listeyi gönderir', () async {
      handler = (r) => MockSupabase.ok({
            'methods': ['A']
          });
      await PaymentMethodsApi(client: supabase.client).replace(['A', 'B']);

      final request = supabase.requests.single;
      expect(request.method, 'PUT');
      expect(request.json, {
        'methods': ['A', 'B']
      });
    });

    test('replace: hata mesajı yoksa genel mesaj', () async {
      handler = (r) => MockSupabase.ok({}, status: 500);
      await expectLater(
        PaymentMethodsApi(client: supabase.client).replace(['A']),
        throwsA(isA<PaymentMethodsApiException>().having(
            (e) => e.message, 'message', 'Ödeme yöntemleri kaydedilemedi.')),
      );
    });
  });

  group('SupportCatalogApi', () {
    test('fetchCatalog: hizmet listesini eşler', () async {
      handler = (r) => MockSupabase.ok({
            'services': [
              {'id': '1', 'name': 'Netflix', 'category': 'streaming'},
              'geçersiz',
            ]
          });
      final catalog =
          await SupportCatalogApi(client: supabase.client).fetchCatalog();
      expect(supabase.requests.single.method, 'GET');
      expect(catalog, [
        {'id': '1', 'name': 'Netflix', 'category': 'streaming'}
      ]);
    });

    test('fetchCatalog: servis alanı yoksa boş liste', () async {
      handler = (r) => MockSupabase.ok({});
      expect(await SupportCatalogApi(client: supabase.client).fetchCatalog(),
          isEmpty);
    });

    test('createTicket: kategori ve mesajı gönderir', () async {
      handler = (r) => MockSupabase.ok({'id': 't1'}, status: 201);
      await SupportCatalogApi(client: supabase.client)
          .createTicket(category: 'Hata bildirimi', message: 'Çöküyor');
      final request = supabase.requests.single;
      expect(request.method, 'POST');
      expect(
          request.json, {'category': 'Hata bildirimi', 'message': 'Çöküyor'});
    });

    test('createTicket: sunucu hatası SupportApiException olur', () async {
      handler = (r) => MockSupabase.ok({'error': 'x'}, status: 500);
      await expectLater(
        SupportCatalogApi(client: supabase.client)
            .createTicket(category: 'a', message: 'b'),
        throwsA(isA<SupportApiException>()),
      );
    });
  });

  group('SupabaseExportRepository', () {
    test('yapılandırılmamışsa açıklayıcı hata', () async {
      final repo = SupabaseExportRepository(
        client: supabase.client,
        configured: false,
      );
      await expectLater(
        repo.createAndProcess(),
        throwsA(isA<ExportException>()
            .having((e) => e.message, 'message', contains('kullanılamıyor'))),
      );
      expect(supabase.requests, isEmpty);
    });

    SupabaseExportRepository configuredRepo() =>
        SupabaseExportRepository(client: supabase.client, configured: true);

    test('istek oluşturur, işler ve indirme bağlantısını döner', () async {
      handler = (r) => r.path.contains('/rpc/')
          ? MockSupabase.ok({'id': 'exp-1'})
          : MockSupabase.ok({'download_url': 'https://example.com/x.csv'});

      final url = await configuredRepo().createAndProcess();

      expect(url, 'https://example.com/x.csv');
      expect(supabase.requests, hasLength(2));
      expect(supabase.requests.first.path,
          '/rest/v1/rpc/request_export_idempotent');
      expect(supabase.requests.first.json['p_idempotency_key'], isNotEmpty);
      expect(supabase.requests.last.path, '/functions/v1/process-export');
      expect(supabase.requests.last.json, {'export_id': 'exp-1'});
    });

    test('kimliksiz istek yanıtı hata verir', () async {
      handler = (r) => MockSupabase.ok({'id': ''});
      await expectLater(
        configuredRepo().createAndProcess(),
        throwsA(isA<ExportException>().having((e) => e.message, 'message',
            'Dışa aktarma isteği oluşturulamadı.')),
      );
    });

    test('bağlantısız yanıt hata verir', () async {
      handler = (r) => r.path.contains('/rpc/')
          ? MockSupabase.ok({'id': 'exp-1'})
          : MockSupabase.ok({'download_url': ''});
      await expectLater(
        configuredRepo().createAndProcess(),
        throwsA(isA<ExportException>().having(
            (e) => e.message, 'message', 'İndirme bağlantısı oluşturulamadı.')),
      );
    });

    test('fonksiyon ve beklenmeyen hatalar kullanıcı dostu mesaja çevrilir',
        () async {
      handler = (r) => r.path.contains('/rpc/')
          ? MockSupabase.ok({'id': 'exp-1'})
          : MockSupabase.ok({'error': 'x'}, status: 500);
      await expectLater(
        configuredRepo().createAndProcess(),
        throwsA(isA<ExportException>().having(
            (e) => e.message, 'message', contains('şu anda kullanılamıyor'))),
      );

      handler = (r) => MockSupabase.ok('bir metin');
      await expectLater(
        configuredRepo().createAndProcess(),
        throwsA(isA<ExportException>()),
      );
    });
  });

  group('NotificationRepository', () {
    test('Supabase yokken boş liste döner', () async {
      expect(await NotificationRepository().fetchRecent('u1'), isEmpty);
    });

    Map<String, dynamic> row(
      String id,
      String type, {
      Map<String, dynamic>? params,
      Object? readAt,
    }) =>
        {
          'id': id,
          'type': type,
          'subscription_id': 's-$id',
          'body_params': params ?? {'name': 'Netflix', 'days': 3},
          'created_at': '2026-09-20T08:00:00Z',
          'read_at': readAt,
        };

    test('son 14 gün, kullanıcı filtresi ve en fazla 50 kayıt istenir',
        () async {
      handler = (r) => MockSupabase.ok([]);
      await NotificationRepository(client: supabase.client).fetchRecent('u1');

      final request = supabase.requests.single;
      expect(request.path, '/rest/v1/notifications');
      expect(request.query['user_id'], 'eq.u1');
      expect(request.query['limit'], '50');
      expect(request.query['order'], startsWith('created_at.desc'));
      final cutoff =
          DateTime.parse(request.query['created_at']!.replaceFirst('gte.', ''));
      expect(DateTime.now().toUtc().difference(cutoff).inDays, 14);
    });

    test('her tür için Türkçe başlık ve gövde üretir', () async {
      handler = (r) => MockSupabase.ok([
            row('1', 'renewal_today'),
            row('2', 'renewal_soon'),
            row('3', 'renewal_upcoming'),
            row('4', 'trial_today'),
            row('5', 'trial_soon'),
            row('6', 'trial_upcoming'),
          ]);
      final items = await NotificationRepository(client: supabase.client)
          .fetchRecent('u1');

      expect(items.map((n) => n.type), NotificationType.values);
      expect(items[0].title, 'Bugün yenileniyor');
      expect(items[0].body, 'Netflix bugün yenileniyor.');
      expect(items[1].title, '3 gün kaldı');
      expect(items[1].body, 'Netflix 3 gün içinde yenileniyor.');
      expect(items[2].title, 'Yaklaşan yenileme');
      expect(items[3].title, 'Ücretsiz deneme bugün sona eriyor');
      expect(items[3].body, 'Netflix ücretsiz denemesi bugün sona eriyor.');
      expect(items[4].title, 'Denemenin bitmesine 3 gün kaldı');
      expect(
          items[5].body, 'Netflix ücretsiz denemesi 3 gün içinde sona eriyor.');
      expect(items.first.subscriptionId, 's-1');
      expect(items.first.createdAt, DateTime.utc(2026, 9, 20, 8));
    });

    test('bilinmeyen türler atlanır, okundu bilgisi eşlenir', () async {
      handler = (r) => MockSupabase.ok([
            row('1', 'bilinmeyen_tur'),
            row('2', 'renewal_today', readAt: '2026-09-20T09:00:00Z'),
            row('3', 'renewal_today', params: {}),
          ]);
      final items = await NotificationRepository(client: supabase.client)
          .fetchRecent('u1');

      expect(items.map((n) => n.id), ['2', '3']);
      expect(items.first.readAtRemote, isTrue);
      expect(items.last.readAtRemote, isFalse);
      expect(items.last.body, ' bugün yenileniyor.',
          reason: 'ad yoksa boş isimle üretilir');
    });

    test('sunucu hatası NetworkException olur', () async {
      handler = (r) => MockSupabase.error('boom', status: 500);
      await expectLater(
        NotificationRepository(client: supabase.client).fetchRecent('u1'),
        throwsA(isA<NetworkException>()),
      );
    });
  });
}
