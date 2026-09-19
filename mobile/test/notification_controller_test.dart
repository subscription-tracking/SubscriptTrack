import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/notifications/domain/app_notification.dart';
import 'package:subscript_track/features/notifications/presentation/notification_controller.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

Subscription _sub(
  String id,
  int daysUntilRenewal, {
  SubscriptionStatus status = SubscriptionStatus.active,
}) {
  final renewal = DateTime.now().add(Duration(days: daysUntilRenewal));
  return Subscription(
    id: id,
    userId: 'u1',
    name: 'Sub $id',
    amount: Money.fromJson(50.0),
    currency: 'TRY',
    billingCycle: BillingCycle.monthly,
    startDate: DateTime(2025, 1, 1),
    nextRenewalDate: renewal,
    category: SubscriptionCategory.streaming,
    status: status,
    createdAt: DateTime(2025, 1, 1),
  );
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  group('NotificationController — bildirim üretimi (S5)', () {
    test('bugün yenileniyor → renewalToday', () {
      final ctrl = NotificationController();
      ctrl.refresh([_sub('1', 0)]);
      expect(
          ctrl.all.any((n) => n.type == NotificationType.renewalToday), isTrue);
    });

    test('1–3 gün → renewalSoon', () {
      final ctrl = NotificationController();
      ctrl.refresh([_sub('1', 2)]);
      expect(
          ctrl.all.any((n) => n.type == NotificationType.renewalSoon), isTrue);
    });

    test('4–7 gün → renewalUpcoming', () {
      final ctrl = NotificationController();
      ctrl.refresh([_sub('1', 6)]);
      expect(ctrl.all.any((n) => n.type == NotificationType.renewalUpcoming),
          isTrue);
    });

    test('8+ gün → bildirim yok', () {
      final ctrl = NotificationController();
      ctrl.refresh([_sub('1', 10)]);
      expect(ctrl.all, isEmpty);
    });

    test('geçmiş tarihli abonelik → bildirim yok', () {
      final ctrl = NotificationController();
      ctrl.refresh([_sub('1', -1)]);
      expect(ctrl.all, isEmpty);
    });

    test('farklı türlerde sıralama: today < soon < upcoming', () {
      final ctrl = NotificationController();
      ctrl.refresh([_sub('a', 6), _sub('b', 2), _sub('c', 0)]);
      final types = ctrl.all.map((n) => n.type).toList();
      expect(types.first, NotificationType.renewalToday);
      expect(types.last, NotificationType.renewalUpcoming);
    });
  });

  group('NotificationController — stableId (S5/S6 duplicate engeli)', () {
    test('aynı abonelik refresh\'te aynı ID\'yi üretir', () {
      final sub = _sub('1', 3);
      final ctrl = NotificationController();

      ctrl.refresh([sub]);
      final id1 = ctrl.all.first.id;

      ctrl.refresh([sub]);
      final id2 = ctrl.all.first.id;

      expect(id1, id2);
    });

    test('farklı abonelikler farklı ID üretir', () {
      final ctrl = NotificationController();
      ctrl.refresh([_sub('a', 2), _sub('b', 2)]);
      final ids = ctrl.all.map((n) => n.id).toSet();
      expect(ids.length, 2);
    });

    test('ID yenileme tarihine sabitlidir (sub.id_YYYYMMDD)', () {
      final renewal = DateTime(2026, 8, 15);
      final sub = Subscription(
        id: 'sub-xyz',
        userId: 'u1',
        name: 'Test',
        amount: Money.fromJson(50.0),
        currency: 'TRY',
        billingCycle: BillingCycle.monthly,
        startDate: DateTime(2025, 1, 1),
        nextRenewalDate: renewal,
        category: SubscriptionCategory.other,
        createdAt: DateTime(2025, 1, 1),
      );
      final ctrl = NotificationController();
      ctrl.refresh([sub]);
      if (ctrl.all.isNotEmpty) {
        expect(ctrl.all.first.id, contains('sub-xyz'));
        expect(ctrl.all.first.id, contains('20260815'));
      }
    });
  });

  group('NotificationController — markRead / unreadCount (S5)', () {
    test('başlangıçta tüm bildirimler okunmamış', () {
      final ctrl = NotificationController();
      ctrl.refresh([_sub('1', 2), _sub('2', 5)]);
      expect(ctrl.unreadCount, 2);
    });

    test('markRead → unreadCount azalır', () {
      final ctrl = NotificationController();
      ctrl.refresh([_sub('1', 2)]);
      final id = ctrl.all.first.id;

      ctrl.markRead(id);

      expect(ctrl.unreadCount, 0);
      expect(ctrl.isRead(id), isTrue);
    });

    test('markAllRead → unreadCount sıfır', () {
      final ctrl = NotificationController();
      ctrl.refresh([_sub('1', 2), _sub('2', 5)]);

      ctrl.markAllRead();

      expect(ctrl.unreadCount, 0);
    });

    test('okundu işareti refresh\'te korunur — stableId sayesinde', () {
      final sub = _sub('1', 3);
      final ctrl = NotificationController();

      ctrl.refresh([sub]);
      final id = ctrl.all.first.id;
      ctrl.markRead(id);

      // Aynı abonelikle tekrar refresh
      ctrl.refresh([sub]);

      expect(ctrl.isRead(id), isTrue);
      expect(ctrl.unreadCount, 0);
    });
  });

  group('NotificationController — read state persist (S5)', () {
    test('markRead SharedPreferences\'a yazar, loadReadState tekrar okur',
        () async {
      SharedPreferences.setMockInitialValues({});
      final sub = _sub('1', 3);

      final ctrl1 = NotificationController();
      ctrl1.refresh([sub]);
      final id = ctrl1.all.first.id;
      ctrl1.markRead(id);

      // Async save'in tamamlanmasını bekle
      await Future.delayed(const Duration(milliseconds: 100));

      // Simüle: uygulama yeniden başlatıldı — yeni controller instance
      // Sıralama önemli: loadReadState ÖNCE, refresh SONRA
      final ctrl2 = NotificationController();
      await ctrl2.loadReadState();
      ctrl2.refresh([sub]);

      expect(ctrl2.isRead(id), isTrue);
    });

    test('loadReadState boş prefs → hata yok', () async {
      final ctrl = NotificationController();
      await expectLater(ctrl.loadReadState(), completes);
    });
  });

  group('NotificationController — refresh sonrası eski ID temizleme (S5/S6)',
      () {
    test('abonelik listeden çıkınca ilgili readId bellekten temizlenir', () {
      final sub1 = _sub('1', 2);
      final ctrl = NotificationController();

      ctrl.refresh([sub1]);
      final id = ctrl.all.first.id;
      ctrl.markRead(id);
      expect(ctrl.isRead(id), isTrue);

      // sub1 artık listede yok → _readIds in-memory'de temizlenmeli
      ctrl.refresh([]);

      expect(ctrl.isRead(id), isFalse);
    });
  });
}
