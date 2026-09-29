import '../domain/subscription_models.dart';

enum SubscriptionSortOption { date, amountAsc, amountDesc, name }

extension SubscriptionSortOptionX on SubscriptionSortOption {
  String get label => switch (this) {
        SubscriptionSortOption.date => 'Yenileme tarihine göre',
        SubscriptionSortOption.amountAsc => 'Fiyat: artan',
        SubscriptionSortOption.amountDesc => 'Fiyat: azalan',
        SubscriptionSortOption.name => 'İsme göre',
      };
}

/// [items] listesini arama metni ve kategoriye göre süzer, [sort]'a göre
/// sıralar. Girdi listesini değiştirmez.
List<Subscription> filterAndSortSubscriptions(
  List<Subscription> items, {
  String query = '',
  SubscriptionCategory? category,
  SubscriptionSortOption sort = SubscriptionSortOption.date,
}) {
  final q = query.toLowerCase();
  final list = items.where((s) {
    final matchSearch = q.isEmpty || s.name.toLowerCase().contains(q);
    final matchCategory = category == null || s.category == category;
    return matchSearch && matchCategory;
  }).toList();

  list.sort((a, b) => switch (sort) {
        SubscriptionSortOption.date =>
          a.nextRenewalDate.compareTo(b.nextRenewalDate),
        SubscriptionSortOption.amountAsc =>
          a.monthlyAmount.compareTo(b.monthlyAmount),
        SubscriptionSortOption.amountDesc =>
          b.monthlyAmount.compareTo(a.monthlyAmount),
        SubscriptionSortOption.name => a.name.compareTo(b.name),
      });
  return list;
}
