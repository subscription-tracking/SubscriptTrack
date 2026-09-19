import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/subscriptions/data/local_subscription_repository.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  test('eşzamanlı yerel create çağrıları kayıt kaybetmez', () async {
    final repository = LocalSubscriptionRepository();
    final results = await Future.wait(
      List.generate(
        8,
        (index) => repository.create(
          userId: 'user-1',
          name: 'Abonelik $index',
          amount: Money.parse('${index + 10}.00'),
          currency: 'TRY',
          billingCycle: BillingCycle.monthly,
          startDate: DateTime.utc(2026, 1, 1),
          nextRenewalDate: DateTime.utc(2026, 2, 1),
          category: SubscriptionCategory.other,
        ),
      ),
    );

    final stored = await repository.getAll('user-1');
    expect(results, hasLength(8));
    expect(stored, hasLength(8));
    expect(stored.map((item) => item.id).toSet(), hasLength(8));
  });
}
