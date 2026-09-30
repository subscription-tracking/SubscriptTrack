import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../core/navigation/app_routes.dart';
import '../../../../shared/design/responsive.dart';
import '../../../../shared/widgets/app_confirm_dialog.dart';
import '../../../../shared/widgets/app_offline_banner.dart';
import '../../domain/subscription_models.dart';
import '../subscription_controller.dart';
import '../subscription_list_view_model.dart';
import '../widgets/list/list_header.dart';
import '../widgets/list/pill_tab_bar.dart';
import '../widgets/list/selection_bar.dart';
import '../widgets/list/filter_sheet.dart';
import '../widgets/list/tab_view.dart';

class SubscriptionListScreen extends StatefulWidget {
  const SubscriptionListScreen({super.key});

  @override
  State<SubscriptionListScreen> createState() => _SubscriptionListScreenState();
}

class _SubscriptionListScreenState extends State<SubscriptionListScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  final _search = TextEditingController();
  Timer? _searchDebounce;
  SubscriptionCategory? _filterCategory;
  SubscriptionSortOption _sort = SubscriptionSortOption.date;
  bool _selectionMode = false;
  final Set<String> _selectedIds = {};

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _search.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 250), () {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _tabs.dispose();
    _search.dispose();
    super.dispose();
  }

  List<Subscription> _filtered(List<Subscription> items) =>
      filterAndSortSubscriptions(
        items,
        query: _search.text,
        category: _filterCategory,
        sort: _sort,
      );

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
    final confirm = await AppConfirmDialog.show(
      context: context,
      title: 'Seçilenleri arşivle',
      message: '$count abonelik ana listeden kaldırılıp arşivlenecek.',
      confirmLabel: 'Arşivle',
    );
    if (!confirm) return;
    final ids = _selectedIds.toList();
    _exitSelectionMode();
    await controller.archiveMany(ids);
  }

  Future<void> _confirmBulkDelete(SubscriptionController controller) async {
    final count = _selectedIds.length;
    final confirm = await AppConfirmDialog.show(
      context: context,
      title: 'Seçilenleri sil',
      message:
          '$count abonelik kalıcı olarak silinecek. Bu işlem geri alınamaz.',
      confirmLabel: 'Kalıcı olarak sil',
      isDestructive: true,
    );
    if (!confirm) return;
    final ids = _selectedIds.toList();
    _exitSelectionMode();
    await controller.deleteMany(ids);
  }

  Future<void> _showFilterSheet(SubscriptionController controller) async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (sheetContext) => SubscriptionFilterSheet(
        category: _filterCategory,
        sort: _sort,
        hasArchived: controller.archived.isNotEmpty,
        onCategory: (c) =>
            _applyAndClose(sheetContext, () => _filterCategory = c),
        onSort: (o) => _applyAndClose(sheetContext, () => _sort = o),
        onOpenArchive: () {
          Navigator.pop(sheetContext);
          context.push(AppRoutes.archivedSubscriptions);
        },
        onImportCsv: () {
          Navigator.pop(sheetContext);
          context.push(AppRoutes.csvImport);
        },
      ),
    );
  }

  /// Seçimi uygular ve sayfayı kapatır.
  void _applyAndClose(BuildContext sheetContext, VoidCallback apply) {
    setState(apply);
    Navigator.pop(sheetContext);
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<SubscriptionController>();

    if (controller.loading && controller.active.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    final history = [
      ...controller.visiblePaused,
      ...controller.visibleCancelled,
      ...controller.visibleExpired,
    ];

    return Scaffold(
      body: ResponsiveCenter(
        child: Column(
          children: [
            AppStatusBanner(
              isOffline: controller.isOffline,
              error: controller.error,
              lastSyncAt: controller.lastSyncAt,
              pendingCount: controller.pendingMutationCount,
              onRetry: controller.load,
              onDismissError: controller.clearError,
            ),
            _selectionMode
                ? SubscriptionSelectionBar(
                    count: _selectedIds.length,
                    onCancel: _exitSelectionMode,
                    onArchive: () => _confirmBulkArchive(controller),
                    onDelete: () => _confirmBulkDelete(controller),
                  )
                : SubscriptionListHeader(
                    searchController: _search,
                    onFilterTap: () => _showFilterSheet(controller),
                    onAddTap: () => _openAdd(context, controller),
                  ),
            PillTabBar(
              controller: _tabs,
              tabs: [
                PillTab('Aktif', controller.visibleActive.length),
                PillTab('Deneme', controller.visibleTrials.length),
                PillTab('Geçmiş', history.length),
              ],
            ),
            Expanded(
              child: TabBarView(
                controller: _tabs,
                children: [
                  _tab(
                    controller,
                    controller.visibleActive,
                    message: 'Aktif abonelik yok',
                    detail:
                        'İlk aboneliğini ekleyerek harcamalarını takip etmeye başla.',
                    showStatus: false,
                  ),
                  _tab(
                    controller,
                    controller.visibleTrials,
                    message: 'Deneme aboneliği yok',
                    detail: 'Ücretsiz denemelerini burada takip edebilirsin.',
                  ),
                  _tab(
                    controller,
                    history,
                    message: 'Geçmiş abonelik yok',
                    detail:
                        'Duraklatılan, iptal edilen ve süresi dolan kayıtlar burada görünür.',
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _tab(
    SubscriptionController controller,
    List<Subscription> items, {
    required String message,
    required String detail,
    bool? showStatus,
  }) {
    return SubscriptionTabView(
      items: _filtered(items),
      allEmpty: items.isEmpty,
      emptyMessage: message,
      emptyDetail: detail,
      controller: controller,
      onRefresh: controller.load,
      onAdd: () => _openAdd(context, controller),
      showAddButton: true,
      selectionMode: _selectionMode,
      selectedIds: _selectedIds,
      onLongPress: _enterSelectionMode,
      onToggleSelect: _toggleSelected,
      showStatus: showStatus ?? true,
    );
  }

  Future<void> _openAdd(
          BuildContext context, SubscriptionController controller) =>
      context.push(AppRoutes.addSubscription);
}
