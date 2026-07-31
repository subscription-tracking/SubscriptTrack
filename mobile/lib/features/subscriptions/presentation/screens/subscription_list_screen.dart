import 'package:flutter/material.dart';

import '../../../../core/utils/date_time_utils.dart';
import '../../domain/subscription_models.dart';
import '../subscription_controller.dart';
import 'add_subscription_screen.dart';
import 'archived_subscriptions_screen.dart';
import 'subscription_detail_screen.dart';

enum _SortOption { date, amount, name }

class SubscriptionListScreen extends StatefulWidget {
  const SubscriptionListScreen({required this.controller, super.key});

  final SubscriptionController controller;

  @override
  State<SubscriptionListScreen> createState() => _SubscriptionListScreenState();
}

class _SubscriptionListScreenState extends State<SubscriptionListScreen> {
  final _search = TextEditingController();
  SubscriptionCategory? _filterCategory;
  _SortOption _sort = _SortOption.date;
  bool _searchVisible = false;

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  List<Subscription> _filtered(List<Subscription> items) {
    var list = items.where((s) {
      final q = _search.text.toLowerCase();
      final matchSearch = q.isEmpty || s.name.toLowerCase().contains(q);
      final matchCat =
          _filterCategory == null || s.category == _filterCategory;
      return matchSearch && matchCat;
    }).toList();

    list.sort((a, b) => switch (_sort) {
          _SortOption.date =>
            a.nextRenewalDate.compareTo(b.nextRenewalDate),
          _SortOption.amount =>
            b.monthlyAmount.compareTo(a.monthlyAmount),
          _SortOption.name => a.name.compareTo(b.name),
        });

    return list;
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.controller,
      builder: (context, _) {
        if (widget.controller.loading &&
            widget.controller.active.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        final filtered = _filtered(widget.controller.active);

        return Scaffold(
          body: Column(
            children: [
              // Arama + filtre toolbar
              _Toolbar(
                searchController: _search,
                searchVisible: _searchVisible,
                filterCategory: _filterCategory,
                sortOption: _sort,
                archivedCount: widget.controller.archived.length,
                onSearchToggle: () => setState(() {
                  _searchVisible = !_searchVisible;
                  if (!_searchVisible) _search.clear();
                }),
                onSearchChanged: (_) => setState(() {}),
                onCategoryChanged: (c) =>
                    setState(() => _filterCategory = c),
                onSortChanged: (s) => setState(() => _sort = s),
                onArchiveTap: () => Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => ArchivedSubscriptionsScreen(
                        controller: widget.controller),
                  ),
                ),
              ),
              // Liste
              Expanded(
                child: widget.controller.active.isEmpty
                    ? _EmptyState(onAdd: () => _openAdd(context))
                    : filtered.isEmpty
                        ? const Center(child: Text('Sonuç bulunamadı.'))
                        : RefreshIndicator(
                            onRefresh: widget.controller.load,
                            child: ListView.separated(
                              padding:
                                  const EdgeInsets.fromLTRB(16, 8, 16, 100),
                              itemCount: filtered.length,
                              separatorBuilder: (_, __) =>
                                  const SizedBox(height: 8),
                              itemBuilder: (context, i) {
                                final sub = filtered[i];
                                return _SubscriptionTile(
                                  subscription: sub,
                                  onTap: () => Navigator.push(
                                    context,
                                    MaterialPageRoute<void>(
                                      builder: (_) =>
                                          SubscriptionDetailScreen(
                                        subscription: sub,
                                        controller: widget.controller,
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
              ),
            ],
          ),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () => _openAdd(context),
            icon: const Icon(Icons.add),
            label: const Text('Abonelik ekle'),
          ),
        );
      },
    );
  }

  Future<void> _openAdd(BuildContext context) => Navigator.push(
        context,
        MaterialPageRoute<void>(
          builder: (_) =>
              AddSubscriptionScreen(controller: widget.controller),
        ),
      );
}

class _Toolbar extends StatelessWidget {
  const _Toolbar({
    required this.searchController,
    required this.searchVisible,
    required this.filterCategory,
    required this.sortOption,
    required this.archivedCount,
    required this.onSearchToggle,
    required this.onSearchChanged,
    required this.onCategoryChanged,
    required this.onSortChanged,
    required this.onArchiveTap,
  });

  final TextEditingController searchController;
  final bool searchVisible;
  final SubscriptionCategory? filterCategory;
  final _SortOption sortOption;
  final int archivedCount;
  final VoidCallback onSearchToggle;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<SubscriptionCategory?> onCategoryChanged;
  final ValueChanged<_SortOption> onSortChanged;
  final VoidCallback onArchiveTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 8, 0),
          child: Row(
            children: [
              // Kategori filtresi chip'i
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      FilterChip(
                        label: const Text('Tümü'),
                        selected: filterCategory == null,
                        onSelected: (_) => onCategoryChanged(null),
                      ),
                      const SizedBox(width: 6),
                      ...SubscriptionCategory.values.map((c) => Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: FilterChip(
                              label: Text(c.label),
                              selected: filterCategory == c,
                              onSelected: (_) => onCategoryChanged(
                                  filterCategory == c ? null : c),
                            ),
                          )),
                    ],
                  ),
                ),
              ),
              // Arama butonu
              IconButton(
                icon: Icon(searchVisible
                    ? Icons.search_off
                    : Icons.search),
                onPressed: onSearchToggle,
              ),
              // Sıralama
              PopupMenuButton<_SortOption>(
                icon: const Icon(Icons.sort),
                onSelected: onSortChanged,
                itemBuilder: (_) => [
                  _sortItem(_SortOption.date, 'Tarihe göre', sortOption),
                  _sortItem(
                      _SortOption.amount, 'Tutara göre', sortOption),
                  _sortItem(_SortOption.name, 'İsme göre', sortOption),
                ],
              ),
              // Arşiv
              if (archivedCount > 0)
                Badge(
                  label: Text('$archivedCount'),
                  child: IconButton(
                    icon: const Icon(Icons.archive_outlined),
                    onPressed: onArchiveTap,
                    tooltip: 'Arşiv',
                  ),
                ),
            ],
          ),
        ),
        // Arama kutusu
        if (searchVisible)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: TextField(
              controller: searchController,
              autofocus: true,
              onChanged: onSearchChanged,
              decoration: InputDecoration(
                hintText: 'Abonelik ara...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          searchController.clear();
                          onSearchChanged('');
                        },
                      )
                    : null,
              ),
            ),
          ),
        const SizedBox(height: 4),
      ],
    );
  }

  PopupMenuItem<_SortOption> _sortItem(
      _SortOption opt, String label, _SortOption current) {
    return PopupMenuItem(
      value: opt,
      child: Row(children: [
        Icon(opt == current ? Icons.radio_button_checked : Icons.radio_button_off,
            size: 18),
        const SizedBox(width: 8),
        Text(label),
      ]),
    );
  }
}

class _SubscriptionTile extends StatelessWidget {
  const _SubscriptionTile(
      {required this.subscription, required this.onTap});

  final Subscription subscription;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final days = subscription.daysUntilRenewal;
    final urgent = days <= 3;

    return Card(
      child: ListTile(
        onTap: onTap,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: colors.primaryContainer,
          child: Icon(_categoryIcon(subscription.category),
              color: colors.onPrimaryContainer),
        ),
        title: Text(subscription.name,
            style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(
          DateTimeUtils.renewalLabel(days),
          style: TextStyle(
              color: urgent
                  ? colors.error
                  : days <= 7
                      ? colors.primary
                      : null),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              DateTimeUtils.formatCurrency(subscription.amount,
                  symbol: subscription.currency),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            Text(subscription.billingCycle.label,
                style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }

  IconData _categoryIcon(SubscriptionCategory cat) => switch (cat) {
        SubscriptionCategory.streaming => Icons.play_circle_outline,
        SubscriptionCategory.music => Icons.music_note_outlined,
        SubscriptionCategory.gaming => Icons.sports_esports_outlined,
        SubscriptionCategory.software => Icons.code,
        SubscriptionCategory.cloud => Icons.cloud_outlined,
        SubscriptionCategory.fitness => Icons.fitness_center_outlined,
        SubscriptionCategory.news => Icons.newspaper_outlined,
        SubscriptionCategory.food => Icons.restaurant_outlined,
        SubscriptionCategory.education => Icons.school_outlined,
        SubscriptionCategory.other => Icons.subscriptions_outlined,
      };
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onAdd});
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.subscriptions_outlined,
                size: 72, color: colors.primary),
            const SizedBox(height: 20),
            Text('Henüz abonelik yok',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              'İlk aboneliğini ekleyerek harcamalarını takip etmeye başla.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 28),
            FilledButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.add),
              label: const Text('Abonelik ekle'),
            ),
          ],
        ),
      ),
    );
  }
}
