import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_theme.dart';
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

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _search.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _tabs.dispose();
    _search.dispose();
    super.dispose();
  }

  List<Subscription> _filtered(List<Subscription> items) {
    final q = _search.text.toLowerCase();
    var list = items.where((s) {
      final matchSearch = q.isEmpty || s.name.toLowerCase().contains(q);
      final matchCat    = _filterCategory == null || s.category == _filterCategory;
      return matchSearch && matchCat;
    }).toList();

    list.sort((a, b) => switch (_sort) {
          _SortOption.date   => a.nextRenewalDate.compareTo(b.nextRenewalDate),
          _SortOption.amount => b.monthlyAmount.compareTo(a.monthlyAmount),
          _SortOption.name   => a.name.compareTo(b.name),
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
          if (controller.isOffline)
            _OfflineBanner(lastSyncAt: controller.lastSyncAt, onRetry: controller.load)
          else if (controller.error != null)
            MaterialBanner(
              content: Text(controller.error!),
              actions: [
                TextButton(onPressed: controller.clearError, child: const Text('Kapat')),
                TextButton(onPressed: controller.load, child: const Text('Tekrar dene')),
              ],
            ),
          _Header(
            controller: controller,
            searchController: _search,
            filterCategory: _filterCategory,
            sortOption: _sort,
            onCategoryChanged: (c) => setState(() => _filterCategory = c),
            onSortChanged: (s) => setState(() => _sort = s),
            onArchiveTap: controller.archived.isEmpty
                ? null
                : () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) =>
                            ArchivedSubscriptionsScreen(controller: controller),
                      ),
                    ),
          ),
          TabBar(
            controller: _tabs,
            indicatorColor: AppColors.primary,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.onSurfaceVar,
            dividerColor: AppColors.border,
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
                _TabView(
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
                _TabView(
                  items: _filtered(controller.paused),
                  allEmpty: controller.paused.isEmpty,
                  emptyMessage: 'Duraklatılmış abonelik yok',
                  emptyDetail: 'Aboneliği detay sayfasından duraklatabilirsin.',
                  controller: controller,
                  onRefresh: controller.load,
                ),
                _TabView(
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
      floatingActionButton: Semantics(
        label: 'Yeni abonelik ekle',
        button: true,
        child: FloatingActionButton(
          onPressed: () => _openAdd(context, controller),
          child: const Icon(Icons.add, color: AppColors.onPrimary),
        ),
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

// ─── Header ──────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({
    required this.controller,
    required this.searchController,
    required this.filterCategory,
    required this.sortOption,
    required this.onCategoryChanged,
    required this.onSortChanged,
    this.onArchiveTap,
  });

  final SubscriptionController controller;
  final TextEditingController searchController;
  final SubscriptionCategory? filterCategory;
  final _SortOption sortOption;
  final ValueChanged<SubscriptionCategory?> onCategoryChanged;
  final ValueChanged<_SortOption> onSortChanged;
  final VoidCallback? onArchiveTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Aboneliklerim',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ),
              PopupMenuButton<_SortOption>(
                icon: Icon(Icons.sort, color: Theme.of(context).colorScheme.onSurfaceVariant),
                color: AppColors.surfaceHigh,
                onSelected: onSortChanged,
                itemBuilder: (_) => [
                  _sortItem(_SortOption.date, 'Tarihe göre', sortOption),
                  _sortItem(_SortOption.amount, 'Tutara göre', sortOption),
                  _sortItem(_SortOption.name, 'İsme göre', sortOption),
                ],
              ),
              if (onArchiveTap != null)
                Badge(
                  label: Text('${controller.archived.length}'),
                  child: IconButton(
                    icon: Icon(Icons.archive_outlined,
                        color: Theme.of(context).colorScheme.onSurfaceVariant),
                    onPressed: onArchiveTap,
                    tooltip: 'Arşiv',
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          // Always-visible search bar
          TextField(
            controller: searchController,
            decoration: InputDecoration(
              hintText: 'Abonelik ara...',
              prefixIcon: const Icon(Icons.search, color: AppColors.onSurfaceVar, size: 20),
              suffixIcon: searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 18),
                      onPressed: searchController.clear,
                    )
                  : null,
            ),
          ),
          const SizedBox(height: 10),
          // Category filter chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _FilterChip(
                  label: 'Tümü',
                  selected: filterCategory == null,
                  onTap: () => onCategoryChanged(null),
                ),
                const SizedBox(width: 6),
                ...SubscriptionCategory.values.map((c) => Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: _FilterChip(
                        label: c.label,
                        selected: filterCategory == c,
                        onTap: () =>
                            onCategoryChanged(filterCategory == c ? null : c),
                      ),
                    )),
              ],
            ),
          ),
        ],
      ),
    );
  }

  PopupMenuItem<_SortOption> _sortItem(
      _SortOption opt, String label, _SortOption current) {
    return PopupMenuItem(
      value: opt,
      child: Row(children: [
        Icon(
          opt == current ? Icons.radio_button_checked : Icons.radio_button_off,
          size: 18,
          color: opt == current ? AppColors.primary : AppColors.onSurfaceVar,
        ),
        const SizedBox(width: 8),
        Text(label, style: const TextStyle(color: AppColors.onSurface)),
      ]),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withValues(alpha: 0.15)
              : AppColors.surfaceHigh,
          borderRadius: BorderRadius.circular(100),
          border: Border.all(
            color: selected ? AppColors.primary.withValues(alpha: 0.4) : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? AppColors.primary : AppColors.onSurfaceVar,
            fontSize: 12,
            fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
          ),
        ),
      ),
    );
  }
}

// ─── Tab View ─────────────────────────────────────────────────────────────────

class _TabView extends StatelessWidget {
  const _TabView({
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
      return Center(
        child: Text(
          'Sonuç bulunamadı.',
          style: Theme.of(context)
              .textTheme
              .bodyMedium
              ?.copyWith(color: AppColors.onSurfaceVar),
        ),
      );
    }

    return RefreshIndicator(
      color: AppColors.primary,
      backgroundColor: AppColors.surface,
      onRefresh: onRefresh,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
        itemCount: items.length + (controller.hasMore ? 1 : 0),
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, i) {
          if (i == items.length) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              controller.loadMore();
            });
            return const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            );
          }
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

// ─── Subscription Tile ────────────────────────────────────────────────────────

class _SubscriptionTile extends StatelessWidget {
  const _SubscriptionTile({required this.subscription, required this.onTap});

  final Subscription subscription;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final days        = subscription.daysUntilRenewal;
    final urgent      = days <= 3;
    final isPaused    = subscription.status == SubscriptionStatus.paused;
    final isCancelled = subscription.status == SubscriptionStatus.cancelled;
    final color       = _avatarColor(subscription.name);
    final initial     = subscription.name.isNotEmpty
        ? subscription.name[0].toUpperCase()
        : '?';

    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: (isPaused || isCancelled)
                      ? AppColors.outline.withValues(alpha: 0.3)
                      : color.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    initial,
                    style: TextStyle(
                      color: (isPaused || isCancelled)
                          ? AppColors.onSurfaceVar
                          : color,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      subscription.name,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            decoration: isCancelled
                                ? TextDecoration.lineThrough
                                : null,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subscription.category.label,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.onSurfaceVar,
                            fontSize: 11,
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    DateTimeUtils.formatCurrency(
                      subscription.amount.amount,
                      symbol: subscription.currency,
                    ),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: isCancelled || isPaused
                              ? AppColors.onSurfaceVar
                              : AppColors.primary,
                        ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (isPaused)
                        const Icon(Icons.pause_circle_outline,
                            size: 11, color: AppColors.onSurfaceVar),
                      if (isCancelled)
                        Icon(Icons.cancel_outlined,
                            size: 11, color: AppColors.error.withValues(alpha: 0.7)),
                      const SizedBox(width: 2),
                      Text(
                        isPaused
                            ? 'Duraklatıldı'
                            : isCancelled
                                ? 'İptal edildi'
                                : DateTimeUtils.renewalLabel(days),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: isPaused
                                  ? AppColors.onSurfaceVar
                                  : isCancelled
                                      ? AppColors.error.withValues(alpha: 0.7)
                                      : urgent
                                          ? AppColors.error
                                          : AppColors.onSurfaceVar,
                              fontSize: 10,
                            ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Empty State ─────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState(
      {required this.message, required this.detail, this.onAdd});
  final String message;
  final String detail;
  final VoidCallback? onAdd;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.grid_view_rounded,
                  size: 34, color: AppColors.primary),
            ),
            const SizedBox(height: 20),
            Text(message,
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(
              detail,
              textAlign: TextAlign.center,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: AppColors.onSurfaceVar),
            ),
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

// ─── Offline Banner ───────────────────────────────────────────────────────────

class _OfflineBanner extends StatelessWidget {
  const _OfflineBanner({required this.onRetry, this.lastSyncAt});
  final VoidCallback onRetry;
  final DateTime? lastSyncAt;

  @override
  Widget build(BuildContext context) {
    final label = lastSyncAt == null
        ? 'Çevrimdışı — önbellek gösteriliyor'
        : 'Çevrimdışı — ${_rel(lastSyncAt!)} önce güncellendi';
    return MaterialBanner(
      backgroundColor: const Color(0xFF2A1F00),
      content: Text(label, style: const TextStyle(color: AppColors.tertiary)),
      actions: [
        TextButton(onPressed: onRetry, child: const Text('Yenile')),
      ],
    );
  }

  static String _rel(DateTime utc) {
    final d = DateTime.now().toUtc().difference(utc);
    if (d.inSeconds < 60) return '${d.inSeconds} sn';
    if (d.inMinutes < 60) return '${d.inMinutes} dk';
    if (d.inHours < 24)   return '${d.inHours} sa';
    return '${d.inDays} gün';
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

Color _avatarColor(String name) {
  const palette = [
    Color(0xFFFF6B6B),
    Color(0xFF4ECDC4),
    Color(0xFFFFD1AA),
    Color(0xFFACC7FF),
    Color(0xFF9D8FFF),
    Color(0xFF57F1DB),
    Color(0xFFFF9F43),
  ];
  final hash = name.codeUnits.fold(0, (a, b) => a + b);
  return palette[hash % palette.length];
}
