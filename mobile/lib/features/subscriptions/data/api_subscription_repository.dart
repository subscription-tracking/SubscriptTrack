import '../../../core/datasources/subscription_data_source.dart';
import '../../../core/domain/money.dart';
import '../../../core/network/api_client.dart';
import '../domain/subscription_models.dart';

class SubscriptionPage {
  const SubscriptionPage({required this.items, this.nextCursor});
  final List<Subscription> items;
  final String? nextCursor;
  bool get hasMore => nextCursor != null;
}

/// REST API üzerinden abonelik işlemleri.
/// Backend response formatı snake_case; burası camelCase modele çevirir.
class ApiSubscriptionRepository implements SubscriptionDataSource {
  const ApiSubscriptionRepository({required this.client});

  final ApiClient client;

  static const _base = '/api/v1/subscriptions';

  // ── Read ────────────────────────────────────────────────────────

  @override
  Future<List<Subscription>> getAll(String userId) async {
    final page = await getPaged();
    return page.items;
  }

  /// Cursor-based pagination. Pass [cursor] from a previous [SubscriptionPage.nextCursor].
  Future<SubscriptionPage> getPaged({
    String? cursor,
    int limit = 50,
  }) async {
    var path = '$_base?limit=$limit';
    if (cursor != null) path += '&cursor=${Uri.encodeQueryComponent(cursor)}';
    final res = await client.get(path);
    final list = (res['items'] as List<dynamic>? ?? const [])
        .map((e) => _fromApi(e as Map<String, dynamic>))
        .toList();
    final nextCursor = res['nextCursor'] as String?;
    return SubscriptionPage(items: list, nextCursor: nextCursor);
  }

  // ── Write ───────────────────────────────────────────────────────

  @override
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
  }) async {
    final res = await client.post(_base, {
      'name': name.trim(),
      'amount': amount.toJson(),
      'currency': currency,
      'billingCycle': billingCycle.key.toUpperCase(),
      'startDate': startDate.toUtc().toIso8601String(),
      'nextRenewalAt': nextRenewalDate.toUtc().toIso8601String(),
      'timezone': 'UTC',
      'categoryCode': _categoryCode(category),
      if (notes != null) 'note': notes.trim(),
    });
    return _fromApi(res);
  }

  @override
  Future<Subscription> update(Subscription updated) async {
    final res = await client.patch('$_base/${updated.id}', {
      'name': updated.name,
      'amount': updated.amount.toJson(),
      'currency': updated.currency,
      'billingCycle': updated.billingCycle.key.toUpperCase(),
      'nextRenewalAt': updated.nextRenewalDate.toUtc().toIso8601String(),
      'categoryCode': _categoryCode(updated.category),
      'note': updated.notes,
    });
    return _fromApi(res);
  }

  @override
  Future<void> delete(String userId, String subscriptionId) =>
      client.delete('$_base/$subscriptionId');

  // ── Status transitions ───────────────────────────────────────────

  @override
  Future<void> archive(String userId, String id) =>
      _setStatus(id, SubscriptionStatus.archived);

  @override
  Future<void> restore(String userId, String id) =>
      _setStatus(id, SubscriptionStatus.active);

  @override
  Future<void> pause(String userId, String id) =>
      _setStatus(id, SubscriptionStatus.paused);

  @override
  Future<void> resume(String userId, String id) =>
      _setStatus(id, SubscriptionStatus.active);

  @override
  Future<void> cancel(String userId, String id) =>
      _setStatus(id, SubscriptionStatus.cancelled);

  Future<void> _setStatus(String id, SubscriptionStatus status) {
    final now = DateTime.now().toUtc().toIso8601String();
    return switch (status) {
      SubscriptionStatus.paused =>
        client.post('$_base/$id/pause', {'effectiveAt': now}),
      SubscriptionStatus.active => client.post('$_base/$id/resume', const {}),
      SubscriptionStatus.cancelled =>
        client.post('$_base/$id/cancel', {'cancelledAt': now}),
      SubscriptionStatus.archived =>
        client.post('$_base/$id/archive', const {}),
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────

  /// API → domain model (snake_case backend alanları)
  Subscription _fromApi(Map<String, dynamic> j) => Subscription(
        id: j['id'] as String,
        userId: (j['userId'] ?? j['user_id'] ?? '') as String,
        name: j['name'] as String,
        amount: Money.fromJson(j['amount']),
        currency: j['currency'] as String? ?? 'TRY',
        billingCycle: BillingCycleLabel.fromKey(
          ((j['billingCycle'] ?? j['billing_cycle'] ?? 'monthly') as String)
              .toLowerCase(),
        ),
        startDate: DateTime.tryParse(
              (j['startDate'] ?? j['start_date'] ?? '') as String,
            ) ??
            DateTime.now(),
        nextRenewalDate: DateTime.tryParse(
              (j['nextRenewalAt'] ?? j['next_renewal_date'] ?? '') as String,
            ) ??
            DateTime.now(),
        category: _categoryFromCode(
          (j['categoryCode'] ?? j['category'] ?? 'OTHER') as String,
        ),
        notes: (j['note'] ?? j['notes']) as String?,
        status: SubscriptionStatusExt.fromKey(
          ((j['status'] ?? 'active') as String).toLowerCase(),
        ),
        createdAt: DateTime.tryParse(
              (j['createdAt'] ?? j['created_at'] ?? '') as String,
            ) ??
            DateTime.now().toUtc(),
      );

  String _categoryCode(SubscriptionCategory category) => switch (category) {
        SubscriptionCategory.streaming => 'ENTERTAINMENT',
        SubscriptionCategory.music => 'MUSIC',
        SubscriptionCategory.gaming => 'GAMING',
        SubscriptionCategory.software => 'SOFTWARE',
        SubscriptionCategory.cloud => 'CLOUD',
        SubscriptionCategory.fitness => 'HEALTH',
        SubscriptionCategory.education => 'EDUCATION',
        SubscriptionCategory.news => 'NEWS',
        SubscriptionCategory.food => 'FOOD',
        SubscriptionCategory.other => 'OTHER',
      };

  SubscriptionCategory _categoryFromCode(String code) => switch (code) {
        'ENTERTAINMENT' => SubscriptionCategory.streaming,
        'MUSIC' => SubscriptionCategory.music,
        'GAMING' => SubscriptionCategory.gaming,
        'SOFTWARE' => SubscriptionCategory.software,
        'CLOUD' => SubscriptionCategory.cloud,
        'HEALTH' => SubscriptionCategory.fitness,
        'EDUCATION' => SubscriptionCategory.education,
        'NEWS' => SubscriptionCategory.news,
        'FOOD' => SubscriptionCategory.food,
        _ => SubscriptionCategory.other,
      };
}
