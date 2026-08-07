import '../domain/money.dart';
import '../../features/subscriptions/domain/subscription_models.dart';

abstract class SubscriptionDataSource {
  Future<List<Subscription>> getAll(String userId);
  Future<Subscription> create({
    required String userId,
    required String name,
    required Money amount,
    required String currency,
    required BillingCycle billingCycle,
    required DateTime startDate,
    required DateTime nextRenewalDate,
    required SubscriptionCategory category,
    String? notes,
    String? paymentMethod,
  });
  Future<Subscription> update(Subscription updated);
  Future<void> delete(String userId, String subscriptionId);
  Future<void> archive(String userId, String subscriptionId);
  Future<void> restore(String userId, String subscriptionId);
  Future<void> pause(String userId, String subscriptionId);
  Future<void> resume(String userId, String subscriptionId);
  Future<void> cancel(String userId, String subscriptionId);
}
