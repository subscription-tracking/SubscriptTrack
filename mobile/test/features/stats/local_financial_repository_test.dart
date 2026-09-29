import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/savings/data/savings_repository.dart';
import 'package:subscript_track/features/stats/data/payment_events_repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() => FlutterSecureStorage.setMockInitialValues({}));

  test('yerel ödeme geçmişi para tutarını kesin değerle saklar', () async {
    final repo = PaymentEventsRepository();
    await repo.record(
      userId: 'local-user',
      subscriptionId: 'subscription-1',
      amount: Money.parse('19.99'),
      currency: 'TRY',
      paidAt: DateTime.utc(2026, 9, 21),
    );

    final events = await repo.fetch('local-user');
    expect(events, hasLength(1));
    expect(events.single.amount.decimalString, '19.99');
  });

  test('yerel tasarruf geçmişi iptal olayını saklar', () async {
    final repo = SavingsRepository();
    await repo.record(
      userId: 'local-user',
      subscriptionId: 'subscription-1',
      eventType: 'CANCELLED',
      monthlyAmount: Money.parse('19.99'),
      annualAmount: Money.parse('239.88'),
      currency: 'TRY',
    );

    final events = await repo.fetch('local-user');
    expect(events, hasLength(1));
    expect(events.single.annualAmount.decimalString, '239.88');
  });
}
