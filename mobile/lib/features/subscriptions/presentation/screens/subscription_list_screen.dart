import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_theme.dart' show AppStatusColorsX;
import '../../../../core/utils/date_time_utils.dart';
import '../../../../shared/design/app_tokens.dart';
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

  Future<void> _confirmBulkArchive(SubscriptionController controller) async {
    final count = _selectedIds.length;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Seçilenleri arşivle'),
        content: Text('$count abonelik ana listeden kaldırılıp arşivlenecek.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Vazgeç'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Arşivle'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    final ids = _selectedIds.toList();
    _exitSelectionMode();
    await controller.archiveMany(ids);
  }

  Future<void> _confirmBulkDelete(SubscriptionController controller) async {
    final count = _selectedIds.length;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Seçilenleri sil'),
        content: Text(
            '$count abonelik kalıcı olarak silinecek. Bu işlem geri alınamaz.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Vazgeç'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
                backgroundColor: Theme.of(ctx).colorScheme.error),
            child: const Text('Kalıcı olarak sil'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    final ids = _selectedIds.toList();
    _exitSelectionMode();
    await controller.deleteMany(ids);
  }

  Future<void> _showFilterSheet(SubscriptionController controller) async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Filtrele ve sırala',
                    style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 20),
                Text('Kategori', style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _FilterChip(
                      label: 'Tümü',
                      selected: _filterCategory == null,
                      onTap: () {
                        setState(() => _filterCategory = null);
                        setSheetState(() {});
                        Navigator.pop(sheetContext);
                      },
                    ),
                    ...SubscriptionCategory.values
                        .map((category) => _FilterChip(
                              label: category.label,
                              selected: _filterCategory == category,
                              onTap: () {
                                setState(() => _filterCategory = category);
                                setSheetState(() {});
                                Navigator.pop(sheetContext);
                              },
                            )),
                  ],
                ),
                const SizedBox(height: 20),
                Text('Sıralama', style: Theme.of(context).textTheme.titleSmall),
                RadioGroup<_SortOption>(
                  groupValue: _sort,
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() => _sort = value);
                    setSheetState(() {});
                    Navigator.pop(sheetContext);
                  },
                  child: Column(
                    children: _SortOption.values
                        .map((option) => RadioListTile<_SortOption>(
                              contentPadding: EdgeInsets.zero,
                              value: option,
                              title: Text(_sortLabel(option)),
                            ))
                        .toList(),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    if (controller.archived.isNotEmpty)
                      TextButton.icon(
                        onPressed: () {
                          Navigator.pop(sheetContext);
                          Navigator.push(
                            context,
                            MaterialPageRoute<void>(
                              builder: (_) => ArchivedSubscriptionsScreen(
                                  controller: controller),
                            ),
                          );
                        },
                        icon: const Icon(Icons.archive_outlined),
                        label: const Text('Arşiv'),
                      ),
                    const Spacer(),
                    TextButton.icon(
                      onPressed: () {
                        Navigator.pop(sheetContext);
                        Navigator.push(
                          context,
                          MaterialPageRoute<void>(
                            builder: (_) =>
                                CsvImportScreen(controller: controller),
                          ),
                        );
                      },
                      icon: const Icon(Icons.upload_file_outlined),
                      label: const Text('CSV içe aktar'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  static String _sortLabel(_SortOption option) => switch (option) {
        _SortOption.date => 'Yenileme tarihine göre',
        _SortOption.amountAsc => 'Fiyat: artan',
        _SortOption.amountDesc => 'Fiyat: azalan',
        _SortOption.name => 'İsme göre',
      };

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<SubscriptionController>();

    if (controller.loading && controller.active.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    final history = [
      ...controller.paused,
      ...controller.cancelled,
      ...controller.expired,
    ];

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
                  onArchive: () => _confirmBulkArchive(controller),
                  onDelete: () => _confirmBulkDelete(controller),
                )
              : _Header(
                  searchController: _search,
                  onFilterTap: () => _showFilterSheet(controller),
                  onAddTap: () => _openAdd(context, controller),
                ),
          _PillTabBar(
            controller: _tabs,
            tabs: [
              _PillTab('Aktif', controller.active.length),
              _PillTab('Deneme', controller.trials.length),
              _PillTab('Geçmiş', history.length),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabs,
              children: [
                _TabView(
                  items: _filtered(controller.active),
                  allEmpty: controller.active.isEmpty,
                  emptyMessage: 'Aktif abonelik yok',
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
                  showStatus: false,
                ),
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
                  items: _filtered(history),
                  allEmpty: history.isEmpty,
                  emptyMessage: 'Geçmiş abonelik yok',
                  emptyDetail:
                      'Duraklatılan, iptal edilen ve süresi dolan kayıtlar burada görünür.',
                  controller: controller,
                  onRefresh: controller.load,
                  onAdd: () => _openAdd(context, controller),
                  showAddButton: true,
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
    required this.searchController,
    required this.onFilterTap,
    required this.onAddTap,
  });

  final TextEditingController searchController;
  final VoidCallback onFilterTap;
  final VoidCallback onAddTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Spacer(),
              IconButton.filledTonal(
                onPressed: onAddTap,
                icon: const Icon(Icons.add_rounded),
                tooltip: 'Abonelik ekle',
              ),
              const SizedBox(width: 4),
              IconButton(
                icon: Icon(Icons.tune_rounded,
                    color: Theme.of(context).colorScheme.onSurfaceVariant),
                onPressed: onFilterTap,
                tooltip: 'Filtrele ve sırala',
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: searchController,
            decoration: InputDecoration(
              hintText: 'Aboneliklerinde ara',
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
        ],
      ),
    );
  }
}

// ─── Selection Bar (toplu arşivleme / silme) ─────────────────────────────────

class _SelectionBar extends StatelessWidget {
  const _SelectionBar({
    required this.count,
    required this.onCancel,
    required this.onArchive,
    required this.onDelete,
  });

  final int count;
  final VoidCallback onCancel;
  final VoidCallback onArchive;
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
          OutlinedButton.icon(
            onPressed: count == 0 ? null : onArchive,
            icon: const Icon(Icons.archive_outlined, size: 18),
            label: const Text('Arşivle'),
          ),
          const SizedBox(width: 8),
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

// ─── Pill Tab Bar (durum sekmeleri) ──────────────────────────────────────────

class _PillTab {
  const _PillTab(this.label, this.count);
  final String label;
  final int count;
}

class _PillTabBar extends StatefulWidget {
  const _PillTabBar({required this.controller, required this.tabs});

  final TabController controller;
  final List<_PillTab> tabs;

  @override
  State<_PillTabBar> createState() => _PillTabBarState();
}

class _PillTabBarState extends State<_PillTabBar> {
  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onChanged);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onChanged);
    super.dispose();
  }

  void _onChanged() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return SizedBox(
      height: 40,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Row(
          children: [
            for (var i = 0; i < widget.tabs.length; i++) ...[
              if (i > 0) const SizedBox(width: 8),
              Builder(builder: (context) {
                final tab = widget.tabs[i];
                final selected = widget.controller.index == i;
                return GestureDetector(
                  onTap: () => widget.controller.animateTo(i),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    height: 40,
                    decoration: BoxDecoration(
                      color: selected ? cs.primary : cs.surfaceContainerHigh,
                      borderRadius: BorderRadius.circular(100),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '${tab.label} ${tab.count}',
                      style: TextStyle(
                        color: selected ? cs.onPrimary : cs.onSurfaceVariant,
                        fontSize: 13,
                        fontWeight:
                            selected ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                  ),
                );
              }),
            ],
          ],
        ),
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
    this.showStatus = true,
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
  final bool showStatus;

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
        padding: AppSpacing.screenWithBottomNav,
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
            showStatus: showStatus,
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
    this.showStatus = true,
  });

  final Subscription subscription;
  final VoidCallback onTap;
  final bool selectionMode;
  final bool selected;
  final VoidCallback? onLongPress;
  final bool showStatus;

  @override
  Widget build(BuildContext context) {
    final days = subscription.daysUntilRenewal;
    final urgent = days <= 3;
    final isPaused = subscription.status == SubscriptionStatus.paused;
    final isCancelled = subscription.status == SubscriptionStatus.cancelled;

    final cs = Theme.of(context).colorScheme;
    final statusColors = context.statusColors;
    return Material(
      color: cs.surfaceContainer,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        onLongPress: onLongPress,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
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
                    if (showStatus)
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(
                            subscription.category.label,
                            style:
                                Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: cs.onSurfaceVariant,
                                      fontSize: 11,
                                    ),
                          ),
                          SubscriptionStatusChip(
                            status: subscription.status,
                            isNotStarted: subscription.isNotStarted,
                            daysUntilRenewal: days,
                          ),
                        ],
                      )
                    else
                      Text(
                        '${subscription.category.label} · ${DateTimeUtils.formatDate(subscription.nextRenewalDate)}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: cs.onSurfaceVariant,
                              fontSize: 11,
                            ),
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Column(
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
                          Icon(Icons.cancel_outlined,
                              size: 11, color: statusColors.success),
                        const SizedBox(width: 2),
                        Flexible(
                          child: Text(
                            isPaused
                                ? 'Duraklatıldı'
                                : isCancelled
                                    ? 'İptal edildi'
                                    : '${DateTimeUtils.formatDate(subscription.nextRenewalDate)} · ${DateTimeUtils.renewalLabel(days)}',
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.right,
                            style:
                                Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: isPaused
                                          ? cs.onSurfaceVariant
                                          : isCancelled
                                              ? statusColors.success
                                              : urgent
                                                  ? cs.error
                                                  : cs.onSurfaceVariant,
                                      fontSize: 10,
                                    ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
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
    final statusColors = context.statusColors;
    final label = lastSyncAt == null
        ? 'Çevrimdışı — önbellek gösteriliyor'
        : 'Çevrimdışı — ${_rel(lastSyncAt!)} önce güncellendi';
    return MaterialBanner(
      backgroundColor: statusColors.warning.withValues(alpha: 0.12),
      content: Text(label, style: TextStyle(color: statusColors.warning)),
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
