import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/utils/date_time_utils.dart';
import '../../domain/subscription_models.dart';
import '../subscription_controller.dart';
import 'add_subscription_screen.dart';
import 'archived_subscriptions_screen.dart';
import 'subscription_detail_screen.dart';

enum _SortOption { date, amount, name }

class SubscriptionListScreen extends StatefulWidget {
  const SubscriptionListScreen({super.key});

  @override
  State<SubscriptionListScreen> createState() => _SubscriptionListScreenState();
}

class _SubscriptionListScreenState extends State<SubscriptionListScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  final _search = TextEditingController();
  SubscriptionCategory? _filterCategory;
  _SortOption _sort = _SortOption.date;
  bool _searchVisible = false;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    _search.dispose();
    super.dispose();
  }

  List<Subscription> _filtered(List<Subscription> items) {
    var list = items.where((s) {
      final q = _search.text.toLowerCase();
      final matchSearch = q.isEmpty || s.name.toLowerCase().contains(q);
      final matchCat = _filterCategory == null || s.category == _filterCategory;
      return matchSearch && matchCat;
    }).toList();

    list.sort((a, b) => switch (_sort) {
          _SortOption.date => a.nextRenewalDate.compareTo(b.nextRenewalDate),
          _SortOption.amount => b.monthlyAmount.compareTo(a.monthlyAmount),
          _SortOption.name => a.name.compareTo(b.name),
        });

    return list;
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<SubscriptionController>();

    if (controller.loading && controller.active.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      body: Column(
        children: [
          _Toolbar(
            searchController: _search,
            searchVisible: _searchVisible,
            filterCategory: _filterCategory,
            sortOption: _sort,
            archivedCount: controller.archived.length,
            onSearchToggle: () => setState(() {
              _searchVisible = !_searchVisible;
              if (!_searchVisible) _search.clear();
            }),
            onSearchChanged: (_) => setState(() {}),
            onCategoryChanged: (c) => setState(() => _filterCategory = c),
            onSortChanged: (s) => setState(() => _sort = s),
            onArchiveTap: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) =>
                    ArchivedSubscriptionsScreen(controller: controller),
              ),
            ),
          ),
          TabBar(
            controller: _tabs,
            tabs: [
              Tab(text: 'Aktif (${controller.active.length})'),
              Tab(text: 'Duraklatıldı (${controller.paused.length})'),
              Tab(text: 'İptal (${controller.cancelled.length})'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabs,
              children: [
                _SubscriptionTabView(
                  items: _filtered(controller.active),
                  allEmpty: controller.active.isEmpty,
                  emptyMessage: 'Henüz abonelik yok',
                  emptyDetail:
                      'İlk aboneliğini ekleyerek harcamalarını takip etmeye başla.',
                  controller: controller,
                  onRefresh: controller.load,
                  onAdd: () => _openAdd(context, controller),
                  showAddButton: true,
                ),
                _SubscriptionTabView(
                  items: _filtered(controller.paused),
                  allEmpty: controller.paused.isEmpty,
                  emptyMessage: 'Duraklatılmış abonelik yok',
                  emptyDetail: 'Aboneliği detay sayfasından duraklatabilirsin.',
                  controller: controller,
                  onRefresh: controller.load,
                ),
                _SubscriptionTabView(
                  items: _filtered(controller.cancelled),
                  allEmpty: controller.cancelled.isEmpty,
                  emptyMessage: 'İptal edilmiş abonelik yok',
                  emptyDetail: 'İptal ettiğin abonelikler burada görünür.',
                  controller: controller,
                  onRefresh: controller.load,
                ),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openAdd(context, controller),
        icon: const Icon(Icons.add),
        label: const Text('Abonelik ekle'),
      ),
    );
  }

  Future<void> _openAdd(
          BuildContext context, SubscriptionController controller) =>
      Navigator.push(
        context,
        MaterialPageRoute<void>(
          builder: (_) => AddSubscriptionScreen(controller: controller),
        ),
      );
}

class _SubscriptionTabView extends StatelessWidget {
  const _SubscriptionTabView({
    required this.items,
    required this.allEmpty,
    required this.emptyMessage,
    required this.emptyDetail,
    required this.controller,
    required this.onRefresh,
    this.onAdd,
    this.showAddButton = false,
  });

  final List<Subscription> items;
  final bool allEmpty;
  final String emptyMessage;
  final String emptyDetail;
  final SubscriptionController controller;
  final Future<void> Function() onRefresh;
  final VoidCallback? onAdd;
  final bool showAddButton;

  @override
  Widget build(BuildContext context) {
    if (allEmpty) {
      return _EmptyState(
        message: emptyMessage,
        detail: emptyDetail,
        onAdd: showAddButton ? onAdd : null,
      );
    }
    if (items.isEmpty) {
      return const Center(child: Text('Sonuç bulunamadı.'));
    }
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, i) {
          final sub = items[i];
          return _SubscriptionTile(
            subscription: sub,
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) => SubscriptionDetailScreen(
                  subscription: sub,
                  controller: controller,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
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
              IconButton(
                icon: Icon(searchVisible ? Icons.search_off : Icons.search),
                onPressed: onSearchToggle,
              ),
              PopupMenuButton<_SortOption>(
                icon: const Icon(Icons.sort),
                onSelected: onSortChanged,
                itemBuilder: (_) => [
                  _sortItem(_SortOption.date, 'Tarihe göre', sortOption),
                  _sortItem(_SortOption.amount, 'Tutara göre', sortOption),
                  _sortItem(_SortOption.name, 'İsme göre', sortOption),
                ],
              ),
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
        Icon(
            opt == current
                ? Icons.radio_button_checked
                : Icons.radio_button_off,
            size: 18),
        const SizedBox(width: 8),
        Text(label),
      ]),
    );
  }
}

class _SubscriptionTile extends StatelessWidget {
  const _SubscriptionTile({required this.subscription, required this.onTap});

  final Subscription subscription;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final days = subscription.daysUntilRenewal;
    final urgent = days <= 3;
    final isPaused = subscription.status == SubscriptionStatus.paused;
    final isCancelled = subscription.status == SubscriptionStatus.cancelled;

    return Card(
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: isPaused
              ? colors.surfaceContainerHighest
              : isCancelled
                  ? colors.errorContainer
                  : colors.primaryContainer,
          child: Icon(_categoryIcon(subscription.category),
              color: isPaused
                  ? colors.onSurfaceVariant
                  : isCancelled
                      ? colors.onErrorContainer
                      : colors.onPrimaryContainer),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(subscription.name,
                  style: TextStyle(
                      fontWeight: FontWeight.w600,
                      decoration:
                          isCancelled ? TextDecoration.lineThrough : null)),
            ),
            if (isPaused)
              Padding(
                padding: const EdgeInsets.only(left: 4),
                child: Icon(Icons.pause_circle_outline,
                    size: 16, color: colors.onSurfaceVariant),
              ),
          ],
        ),
        subtitle: Text(
          isPaused
              ? 'Duraklatıldı'
              : isCancelled
                  ? 'İptal edildi'
                  : DateTimeUtils.renewalLabel(days),
          style: TextStyle(
              color: isPaused
                  ? colors.onSurfaceVariant
                  : isCancelled
                      ? colors.error
                      : urgent
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
              style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: isCancelled ? colors.onSurfaceVariant : null),
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
  const _EmptyState(
      {required this.message, required this.detail, this.onAdd});
  final String message;
  final String detail;
  final VoidCallback? onAdd;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.subscriptions_outlined, size: 72, color: colors.primary),
            const SizedBox(height: 20),
            Text(message, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(detail,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium),
            if (onAdd != null) ...[
              const SizedBox(height: 28),
              FilledButton.icon(
                onPressed: onAdd,
                icon: const Icon(Icons.add),
                label: const Text('Abonelik ekle'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
