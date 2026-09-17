import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/utils/date_time_utils.dart';
import '../../../../shared/widgets/app_empty_state.dart';
import '../../../../shared/widgets/service_identity.dart';
import '../../../../shared/widgets/subscription_status_chip.dart';
import '../../domain/subscription_models.dart';
import '../subscription_controller.dart';
import 'add_subscription_screen.dart';
import 'archived_subscriptions_screen.dart';
import 'subscription_detail_screen.dart';
import 'csv_import_screen.dart';

enum _SortOption { date, amountAsc, amountDesc, name }

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
  bool _selectionMode = false;
  final Set<String> _selectedIds = {};

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 5, vsync: this);
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
      final matchCat = _filterCategory == null || s.category == _filterCategory;
      return matchSearch && matchCat;
    }).toList();

    list.sort((a, b) => switch (_sort) {
          _SortOption.date => a.nextRenewalDate.compareTo(b.nextRenewalDate),
          _SortOption.amountAsc => a.monthlyAmount.compareTo(b.monthlyAmount),
          _SortOption.amountDesc => b.monthlyAmount.compareTo(a.monthlyAmount),
          _SortOption.name => a.name.compareTo(b.name),
        });

    return list;
  }

  void _enterSelectionMode(String seedId) {
    setState(() {
      _selectionMode = true;
      _selectedIds
        ..clear()
        ..add(seedId);
    });
  }

  void _exitSelectionMode() {
    setState(() {
      _selectionMode = false;
      _selectedIds.clear();
    });
  }

  void _toggleSelected(String id) {
    setState(() {
      if (_selectedIds.contains(id)) {
        _selectedIds.remove(id);
        if (_selectedIds.isEmpty) _selectionMode = false;
      } else {
        _selectedIds.add(id);
      }
    });
  }

  Future<void> _confirmBulkDelete(SubscriptionController controller) async {
    final count = _selectedIds.length;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Seçilenleri sil'),
        content: Text(
            '$count abonelik kalıcı olarak silinecek. Emin misin?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Vazgeç'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
                backgroundColor: Theme.of(ctx).colorScheme.error),
            child: const Text('Sil'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    final ids = _selectedIds.toList();
    _exitSelectionMode();
    await controller.deleteMany(ids);
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
            _OfflineBanner(
                lastSyncAt: controller.lastSyncAt, onRetry: controller.load)
          else if (controller.error != null)
            MaterialBanner(
              content: Text(controller.error!),
              actions: [
                TextButton(
                    onPressed: controller.clearError,
                    child: const Text('Kapat')),
                TextButton(
                    onPressed: controller.load,
                    child: const Text('Tekrar dene')),
              ],
            ),
          _selectionMode
              ? _SelectionBar(
                  count: _selectedIds.length,
                  onCancel: _exitSelectionMode,
                  onDelete: () => _confirmBulkDelete(controller),
                )
              : _Header(
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
                              builder: (_) => ArchivedSubscriptionsScreen(
                                  controller: controller),
                            ),
                          ),
                  onImportTap: () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                          builder: (_) =>
                              CsvImportScreen(controller: controller))),
                ),
          TabBar(
            controller: _tabs,
            indicatorColor: Theme.of(context).colorScheme.primary,
            labelColor: Theme.of(context).colorScheme.primary,
            unselectedLabelColor:
                Theme.of(context).colorScheme.onSurfaceVariant,
            dividerColor: Theme.of(context).colorScheme.outlineVariant,
            tabs: [
              Tab(text: 'Deneme (${controller.trials.length})'),
              Tab(text: 'Aktif (${controller.active.length})'),
              Tab(text: 'Duraklatıldı (${controller.paused.length})'),
              Tab(text: 'İptal (${controller.cancelled.length})'),
              Tab(text: 'Süresi doldu (${controller.expired.length})'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabs,
              children: [
                _TabView(
                  items: _filtered(controller.trials),
                  allEmpty: controller.trials.isEmpty,
                  emptyMessage: 'Deneme aboneliği yok',
                  emptyDetail:
                      'Ücretsiz denemelerini burada takip edebilirsin.',
                  controller: controller,
                  onRefresh: controller.load,
                  onAdd: () => _openAdd(context, controller),
                  showAddButton: true,
                  selectionMode: _selectionMode,
                  selectedIds: _selectedIds,
                  onLongPress: _enterSelectionMode,
                  onToggleSelect: _toggleSelected,
                ),
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
                  selectionMode: _selectionMode,
                  selectedIds: _selectedIds,
                  onLongPress: _enterSelectionMode,
                  onToggleSelect: _toggleSelected,
                ),
                _TabView(
                  items: _filtered(controller.paused),
                  allEmpty: controller.paused.isEmpty,
                  emptyMessage: 'Duraklatılmış abonelik yok',
                  emptyDetail: 'Aboneliği detay sayfasından duraklatabilirsin.',
                  controller: controller,
                  onRefresh: controller.load,
                  selectionMode: _selectionMode,
                  selectedIds: _selectedIds,
                  onLongPress: _enterSelectionMode,
                  onToggleSelect: _toggleSelected,
                ),
                _TabView(
                  items: _filtered(controller.cancelled),
                  allEmpty: controller.cancelled.isEmpty,
                  emptyMessage: 'İptal edilmiş abonelik yok',
                  emptyDetail: 'İptal ettiğin abonelikler burada görünür.',
                  controller: controller,
                  onRefresh: controller.load,
                  selectionMode: _selectionMode,
                  selectedIds: _selectedIds,
                  onLongPress: _enterSelectionMode,
                  onToggleSelect: _toggleSelected,
                ),
                _TabView(
                  items: _filtered(controller.expired),
                  allEmpty: controller.expired.isEmpty,
                  emptyMessage: 'Süresi dolmuş abonelik yok',
                  emptyDetail: 'Süresi dolan abonelikler burada görünür.',
                  controller: controller,
                  onRefresh: controller.load,
                  selectionMode: _selectionMode,
                  selectedIds: _selectedIds,
                  onLongPress: _enterSelectionMode,
                  onToggleSelect: _toggleSelected,
                ),
              ],
            ),
          ),
        ],
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
    required this.onImportTap,
  });

  final SubscriptionController controller;
  final TextEditingController searchController;
  final SubscriptionCategory? filterCategory;
  final _SortOption sortOption;
  final ValueChanged<SubscriptionCategory?> onCategoryChanged;
  final ValueChanged<_SortOption> onSortChanged;
  final VoidCallback? onArchiveTap;
  final VoidCallback onImportTap;

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
                icon: Icon(Icons.sort,
                    color: Theme.of(context).colorScheme.onSurfaceVariant),
                color: Theme.of(context).colorScheme.surfaceContainerHigh,
                onSelected: onSortChanged,
                itemBuilder: (ctx) => [
                  _sortItem(ctx, _SortOption.date, 'Tarihe göre', sortOption),
                  _sortItem(
                      ctx, _SortOption.amountAsc, 'Fiyat: Artan', sortOption),
                  _sortItem(
                      ctx, _SortOption.amountDesc, 'Fiyat: Azalan', sortOption),
                  _sortItem(ctx, _SortOption.name, 'İsme göre', sortOption),
                ],
              ),
              IconButton(
                  icon: const Icon(Icons.upload_file_outlined),
                  onPressed: onImportTap,
                  tooltip: 'CSV içe aktar'),
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
              prefixIcon: Icon(Icons.search,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  size: 20),
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

  PopupMenuItem<_SortOption> _sortItem(BuildContext context, _SortOption opt,
      String label, _SortOption current) {
    final cs = Theme.of(context).colorScheme;
    return PopupMenuItem(
      value: opt,
      child: Row(children: [
        Icon(
          opt == current ? Icons.radio_button_checked : Icons.radio_button_off,
          size: 18,
          color: opt == current ? cs.primary : cs.onSurfaceVariant,
        ),
        const SizedBox(width: 8),
        Text(label),
      ]),
    );
  }
}

// ─── Selection Bar (toplu silme) ───────────────────────────────────────────────

class _SelectionBar extends StatelessWidget {
  const _SelectionBar({
    required this.count,
    required this.onCancel,
    required this.onDelete,
  });

  final int count;
  final VoidCallback onCancel;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.close),
            tooltip: 'Seçimi iptal et',
            onPressed: onCancel,
          ),
          Expanded(
            child: Text(
              '$count seçildi',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ),
          FilledButton.icon(
            onPressed: count == 0 ? null : onDelete,
            style: FilledButton.styleFrom(backgroundColor: cs.error),
            icon: const Icon(Icons.delete_outline, size: 18),
            label: const Text('Sil'),
          ),
        ],
      ),
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
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: selected
              ? cs.primary.withValues(alpha: 0.15)
              : cs.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(100),
          border: Border.all(
            color: selected
                ? cs.primary.withValues(alpha: 0.4)
                : cs.outlineVariant,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? cs.primary : cs.onSurfaceVariant,
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
    this.selectionMode = false,
    this.selectedIds = const {},
    this.onLongPress,
    this.onToggleSelect,
  });

  final List<Subscription> items;
  final bool allEmpty;
  final String emptyMessage;
  final String emptyDetail;
  final SubscriptionController controller;
  final Future<void> Function() onRefresh;
  final VoidCallback? onAdd;
  final bool showAddButton;
  final bool selectionMode;
  final Set<String> selectedIds;
  final ValueChanged<String>? onLongPress;
  final ValueChanged<String>? onToggleSelect;

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
              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
        ),
      );
    }

    return RefreshIndicator(
      color: Theme.of(context).colorScheme.primary,
      backgroundColor: Theme.of(context).colorScheme.surfaceContainer,
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
            selectionMode: selectionMode,
            selected: selectedIds.contains(sub.id),
            onTap: () {
              if (selectionMode) {
                onToggleSelect?.call(sub.id);
              } else {
                Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => SubscriptionDetailScreen(
                      subscription: sub,
                      controller: controller,
                    ),
                  ),
                );
              }
            },
            onLongPress: () => onLongPress?.call(sub.id),
          );
        },
      ),
    );
  }
}

// ─── Subscription Tile ────────────────────────────────────────────────────────

class _SubscriptionTile extends StatelessWidget {
  const _SubscriptionTile({
    required this.subscription,
    required this.onTap,
    this.selectionMode = false,
    this.selected = false,
    this.onLongPress,
  });

  final Subscription subscription;
  final VoidCallback onTap;
  final bool selectionMode;
  final bool selected;
  final VoidCallback? onLongPress;

  @override
  Widget build(BuildContext context) {
    final days = subscription.daysUntilRenewal;
    final urgent = days <= 3;
    final isPaused = subscription.status == SubscriptionStatus.paused;
    final isCancelled = subscription.status == SubscriptionStatus.cancelled;

    final cs = Theme.of(context).colorScheme;
    return Material(
      color: cs.surfaceContainer,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        onLongPress: onLongPress,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selected ? cs.primary : cs.outlineVariant,
              width: selected ? 1.5 : 0.5,
            ),
          ),
          child: Row(
            children: [
              if (selectionMode) ...[
                Checkbox(
                  value: selected,
                  onChanged: (_) => onTap(),
                ),
                const SizedBox(width: 4),
              ],
              Opacity(
                opacity: isPaused || isCancelled ? .55 : 1,
                child: ServiceIdentity(
                  name: subscription.name,
                  category: subscription.category,
                  size: 42,
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
                            decoration:
                                isCancelled ? TextDecoration.lineThrough : null,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subscription.category.label,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: cs.onSurfaceVariant,
                            fontSize: 11,
                          ),
                    ),
                    const SizedBox(height: 6),
                    SubscriptionStatusChip(
                      status: subscription.status,
                      daysUntilRenewal: days,
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
                              ? cs.onSurfaceVariant
                              : cs.primary,
                        ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (isPaused)
                        Icon(Icons.pause_circle_outline,
                            size: 11, color: cs.onSurfaceVariant),
                      if (isCancelled)
                        const Icon(Icons.cancel_outlined,
                            size: 11, color: Color(0xFF16A36A)),
                      const SizedBox(width: 2),
                      Text(
                        isPaused
                            ? 'Duraklatıldı'
                            : isCancelled
                                ? 'İptal edildi'
                                : DateTimeUtils.renewalLabel(days),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: isPaused
                                  ? cs.onSurfaceVariant
                                  : isCancelled
                                      ? const Color(0xFF16A36A)
                                      : urgent
                                          ? cs.error
                                          : cs.onSurfaceVariant,
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
  const _EmptyState({required this.message, required this.detail, this.onAdd});
  final String message;
  final String detail;
  final VoidCallback? onAdd;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: AppEmptyState(
          icon: Icons.grid_view_rounded,
          title: message,
          description: detail,
          actionLabel: onAdd == null ? null : 'Abonelik ekle',
          onAction: onAdd,
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
    final cs = Theme.of(context).colorScheme;
    final isDark = cs.brightness == Brightness.dark;
    final label = lastSyncAt == null
        ? 'Çevrimdışı — önbellek gösteriliyor'
        : 'Çevrimdışı — ${_rel(lastSyncAt!)} önce güncellendi';
    return MaterialBanner(
      backgroundColor: isDark ? const Color(0xFF2A1F00) : cs.tertiaryContainer,
      content: Text(label, style: TextStyle(color: cs.tertiary)),
      actions: [
        TextButton(onPressed: onRetry, child: const Text('Yenile')),
      ],
    );
  }

  static String _rel(DateTime utc) {
    final d = DateTime.now().toUtc().difference(utc);
    if (d.inSeconds < 60) return '${d.inSeconds} sn';
    if (d.inMinutes < 60) return '${d.inMinutes} dk';
    if (d.inHours < 24) return '${d.inHours} sa';
    return '${d.inDays} gün';
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
