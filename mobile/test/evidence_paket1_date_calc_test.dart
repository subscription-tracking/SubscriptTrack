// PAKET 1 — Tarih Hesaplama Mantığı: kanıtlı inceleme
//
// Bu dosya, Test Senaryoları Excel'indeki 5, 6, 8, 42, 43, 44, 45 numaralı
// senaryoları GERÇEK proje kodu üzerinden (subscription_models.dart ve
// subscription_form.dart) çalıştırıp assert eder. Sonuçlar iddia değil,
// `flutter test` çıktısıyla doğrulanmış gerçek davranıştır.

import 'package:flutter_test/flutter_test.dart';

import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/utils/date_time_utils.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/widgets/subscription_form.dart';

Subscription _sub({
  required DateTime nextRenewalDate,
  BillingCycle billingCycle = BillingCycle.monthly,
}) =>
    Subscription(
      id: 's1',
      userId: 'u1',
      name: 'Test',
      amount: Money.parse('100'),
      currency: 'TRY',
      billingCycle: billingCycle,
      startDate: nextRenewalDate,
      nextRenewalDate: nextRenewalDate,
      category: SubscriptionCategory.other,
      createdAt: nextRenewalDate,
    );

void main() {
  group('TEST 42 — Ay sonu (31\'inde başlayan aylık) kısa aylarda hesaplama',
      () {
    test(
        'DÜZELTME SONRASI: projectedRenewals 31 Ocak -> 28 Şubat\'a SABİTLENİYOR (FIXED)',
        () {
      final sub = _sub(
        nextRenewalDate: DateTime(2026, 1, 31),
        billingCycle: BillingCycle.monthly,
      );
      // projectedRenewals()[0] mevcut nextRenewalDate'in kendisidir (değişmez);
      // hesaplanan "bir sonraki" tarih index [1]'dedir.
      final next = sub.projectedRenewals(count: 2)[1];

      expect(next, DateTime(2026, 2, 28),
          reason: 'addMonthsClamped ile Mart\'a taşma yerine ayın son gününe '
              '(28 Şubat 2026, artık yıl değil) sabitleniyor. Bug DÜZELTİLDİ.');
    });

    test('kontrast: gün taşması olmayan tarihte (15\'i) sorun yok', () {
      final sub = _sub(
        nextRenewalDate: DateTime(2026, 1, 15),
        billingCycle: BillingCycle.monthly,
      );
      final next = sub.projectedRenewals(count: 2)[1];
      expect(next,
          DateTime(2026, 2, 15)); // burada bug tetiklenmiyor, doğru çalışıyor
    });
  });

  group('TEST 43 — 29 Şubat başlangıçlı yıllık abonelik, artık olmayan yılda',
      () {
    test(
        'DÜZELTME SONRASI: projectedRenewals 29 Şubat 2024 -> 28 Şubat 2025\'e SABİTLENİYOR (FIXED)',
        () {
      final sub = _sub(
        nextRenewalDate: DateTime(2024, 2, 29),
        billingCycle: BillingCycle.yearly,
      );
      final next = sub.projectedRenewals(count: 2)[1];

      expect(next, DateTime(2025, 2, 28),
          reason:
              'addMonthsClamped ile 2025 (artık olmayan yıl) için 28 Şubat\'a '
              'sabitleniyor, Mart\'a taşmıyor. Bug DÜZELTİLDİ.');
    });
  });

  group('TEST 44 — Yıl/ay sınırını aşan geçişler (kontrast - regresyon değil)',
      () {
    test('Aralık -> Ocak geçişi doğru çalışıyor', () {
      final sub = _sub(
        nextRenewalDate: DateTime(2026, 12, 10),
        billingCycle: BillingCycle.monthly,
      );
      final next = sub.projectedRenewals(count: 2)[1];
      expect(next, DateTime(2027, 1, 10));
    });

    test('yıllık abonelikte yıl sınırı geçişi doğru çalışıyor', () {
      final sub = _sub(
        nextRenewalDate: DateTime(2026, 12, 25),
        billingCycle: BillingCycle.yearly,
      );
      final next = sub.projectedRenewals(count: 2)[1];
      expect(next, DateTime(2027, 12, 25));
    });
  });

  group(
      'TEST 8 — Farklı periyotlarla ekleme: temel hesap doğruluğu (gün taşması yokken)',
      () {
    test('haftalık +7 gün', () {
      final sub = _sub(
          nextRenewalDate: DateTime(2026, 3, 10),
          billingCycle: BillingCycle.weekly);
      expect(sub.projectedRenewals(count: 2)[1], DateTime(2026, 3, 17));
    });

    test('3 aylık +3 ay', () {
      final sub = _sub(
          nextRenewalDate: DateTime(2026, 3, 10),
          billingCycle: BillingCycle.quarterly);
      expect(sub.projectedRenewals(count: 2)[1], DateTime(2026, 6, 10));
    });
  });

  group('TEST 34/45 — Gecikmiş yenileme ve otomatik ilerletme', () {
    test(
        'projectedRenewals saf/immutable bir projeksiyondur — kaydın '
        'nextRenewalDate\'ini mutasyona uğratmaz (otomatik ilerletme '
        'SubscriptionController.load() içinde ayrıca yapılır, bkz. '
        'subscription_controller_test.dart)', () {
      // "Bugün" 2026-09-17 varsayımıyla, 3 ay önce kaçırılmış aylık bir abonelik:
      final missedRenewal = DateTime(2026, 6, 17);
      final sub = _sub(
          nextRenewalDate: missedRenewal, billingCycle: BillingCycle.monthly);

      // Subscription.projectedRenewals() bilerek SAF bir projeksiyon
      // yardımcısıdır (ekranda "gelecek 12 ay" gibi listeler için) ve
      // kayıtlı nextRenewalDate'i mutasyona uğratmaz. Gerçek otomatik
      // ilerletme SubscriptionController.load() -> _advanceOverdueRenewals()
      // içinde, DateTimeUtils.nextOccurrenceOnOrAfter ile yapılır.
      final projected = sub.projectedRenewals(count: 2);
      expect(sub.nextRenewalDate, missedRenewal,
          reason:
              'projectedRenewals çağrısı orijinal nesneyi DEĞİŞTİRMEZ (immutable).');
      expect(projected[0], missedRenewal);
      expect(projected[1], DateTime(2026, 7, 17));
    });

    test('gecikmiş ACTIVE kayıt "expired" durumuna geçemez', () {
      expect(
          SubscriptionStatus.active.canTransitionTo(SubscriptionStatus.expired),
          isFalse,
          reason: 'Tasarım gereği aktif abonelik "expired" olmuyor; gecikmiş '
              'durum otomatik olarak bir sonraki döneme ilerletilir. '
              'Trial\'lar ise ayrı olarak _expireEndedTrials ile expired olabiliyor.');
    });
  });

  group(
      'TEST 5/6 — Form: geçmiş/gelecek başlangıç tarihiyle otomatik yenileme hesabı',
      () {
    test(
        'FIXED — TEST 5: geçmiş başlangıç tarihi (1 yıl önce, aylık) seçilince '
        'kaçırılan periyotlar atlanıp bugünden sonraki en yakın yenilemeye ulaşılıyor',
        () {
      final now = DateTime(2026, 9, 19);
      final startDate = DateTime(2025, 9, 10);
      final data = SubscriptionFormData(
        startDate: startDate,
        billingCycle: BillingCycle.monthly,
      );
      data.recalculateNextRenewal(now: now);

      // FIXED: nextOccurrenceOnOrAfter, 1 yıl önceki başlangıçtan itibaren
      // kaçırılan ~12 aylık periyodu atlayıp bugünden SONRAKİ en yakın
      // yenilemeye ulaşıyor — artık geçmişte bir tarih dönmüyor.
      final expectedNext = DateTimeUtils.nextOccurrenceOnOrAfter(
          startDate, 'monthly', now,
          originalAnchor: startDate);
      expect(data.nextRenewalDate, expectedNext);
      expect(data.nextRenewalDate.isBefore(now), isFalse,
          reason: 'Hesaplanan yenileme tarihi bugün ya da sonrasında olmalı.');
    });

    test(
        'FIXED — TEST 6: gelecekteki başlangıç tarihi seçilince ilk yenileme '
        'tarihi artık başlangıç tarihiyle AYNI', () {
      final now = DateTime(2026, 9, 19);
      final startDate = DateTime(2026, 11, 18);
      final data = SubscriptionFormData(
        startDate: startDate,
        billingCycle: BillingCycle.monthly,
      );
      data.recalculateNextRenewal(now: now);

      // FIXED: Excel beklentisi "ilk yenileme tarihi == başlangıç tarihi" idi.
      // nextOccurrenceOnOrAfter, anchor (startDate) zaten bugün/gelecekteyse
      // onu OLDUĞU GİBİ döndürür — artık +1 döngü eklenmiyor.
      expect(data.nextRenewalDate, startDate,
          reason: 'Gelecekteki bir başlangıç için ilk yenileme artık '
              'başlangıç tarihiyle BİREBİR AYNI. Excel beklentisi SAĞLANDI.');
    });
  });
}
