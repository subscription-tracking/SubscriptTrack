import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/network/api_client.dart';
import 'package:subscript_track/core/network/token_provider.dart';
import 'package:subscript_track/features/subscriptions/data/api_subscription_repository.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

class _TokenProvider implements TokenProvider {
  @override
  Future<String?> getToken() async => 'test-token';
}

Map<String, dynamic> _apiSubscription() => {
      'id': 'sub-1',
      'userId': 'user-1',
      'name': 'Netflix',
      'status': 'ACTIVE',
      'categoryCode': 'ENTERTAINMENT',
      'amount': '49.90',
      'currency': 'TRY',
      'billingCycle': 'MONTHLY',
      'startDate': '2026-08-01T00:00:00.000Z',
      'nextRenewalAt': '2026-09-01T00:00:00.000Z',
      'createdAt': '2026-08-01T00:00:00.000Z',
    };

void main() {
  test('backend list contract maps items and cursor', () async {
    late Uri requested;
    final client = ApiClient(
      tokenProvider: _TokenProvider(),
      baseUrl: 'https://api.test',
      httpClient: MockClient((request) async {
        requested = request.url;
        return http.Response(
          jsonEncode({'items': [_apiSubscription()], 'nextCursor': 'cursor-2'}),
          200,
        );
      }),
    );
    final repository = ApiSubscriptionRepository(client: client);

    final page = await repository.getPaged(cursor: 'cursor-1');

    expect(requested.path, '/api/v1/subscriptions');
    expect(requested.queryParameters['cursor'], 'cursor-1');
    expect(page.nextCursor, 'cursor-2');
    expect(page.items.single.category, SubscriptionCategory.streaming);
    expect(page.items.single.status, SubscriptionStatus.active);
  });

  test('backend create contract uses backend field names and values', () async {
    late Map<String, dynamic> body;
    final client = ApiClient(
      tokenProvider: _TokenProvider(),
      baseUrl: 'https://api.test',
      httpClient: MockClient((request) async {
        body = jsonDecode(request.body) as Map<String, dynamic>;
        return http.Response(jsonEncode(_apiSubscription()), 201);
      }),
    );
    final repository = ApiSubscriptionRepository(client: client);

    final result = await repository.create(
      userId: 'user-1',
      name: 'Netflix',
      amount: Money.parse('49.90'),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime.utc(2026, 8, 1),
      nextRenewalDate: DateTime.utc(2026, 9, 1),
      category: SubscriptionCategory.streaming,
    );

    expect(body['amount'], '49.90');
    expect(body['billingCycle'], 'MONTHLY');
    expect(body['categoryCode'], 'ENTERTAINMENT');
    expect(body['timezone'], 'UTC');
    expect(result.id, 'sub-1');
  });
}
