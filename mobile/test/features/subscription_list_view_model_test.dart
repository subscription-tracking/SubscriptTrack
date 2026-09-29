import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_list_view_model.dart';

Subscription _sub(
  String name,
  String amount,
  DateTime renewal, {
  SubscriptionCategory category = SubscriptionCategory.streaming,
}) =>
    Subscription(
      id: name,
      userId: 'u',
      name: name,
      amount: Money.parse(amount),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime(2026, 1, 1),
      nextRenewalDate: renewal,
      category: category,
      createdAt: DateTime(2026, 1, 1),
    );

void main() {
  final items = [
    _sub('Netflix', '100', DateTime(2026, 10, 5)),
    _sub('Spotify', '50', DateTime(2026, 10, 1),
        category: SubscriptionCategory.music),
    _sub('Apple Music', '75', DateTime(2026, 10, 3),
        category: SubscriptionCategory.music),
  ];

  List<String> names(List<Subscription> l) => l.map((s) => s.name).toList();

  test('varsayılan sıralama yenileme tarihine göre', () {
    expect(names(filterAndSortSubscriptions(items)),
        ['Spotify', 'Apple Music', 'Netflix']);
  });

  test('fiyat artan / azalan / isim', () {
    expect(
        names(filterAndSortSubscriptions(items,
            sort: SubscriptionSortOption.amountAsc)),
        ['Spotify', 'Apple Music', 'Netflix']);
    expect(
        names(filterAndSortSubscriptions(items,
            sort: SubscriptionSortOption.amountDesc)),
        ['Netflix', 'Apple Music', 'Spotify']);
    expect(
        names(filterAndSortSubscriptions(items,
            sort: SubscriptionSortOption.name)),
        ['Apple Music', 'Netflix', 'Spotify']);
  });

  test('arama büyük/küçük harf duyarsız, kategori süzer', () {
    expect(names(filterAndSortSubscriptions(items, query: 'MUSIC')),
        ['Apple Music']);
    expect(
        names(filterAndSortSubscriptions(items,
            category: SubscriptionCategory.music)),
        ['Spotify', 'Apple Music']);
  });

  test('girdi listesini değiştirmez', () {
    final before = names(items);
    filterAndSortSubscriptions(items, sort: SubscriptionSortOption.name);
    expect(names(items), before);
  });

  test('etiketler', () {
    expect(SubscriptionSortOption.amountAsc.label, 'Fiyat: artan');
  });
}
