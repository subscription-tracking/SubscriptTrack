import 'package:flutter/material.dart';

import '../../../domain/subscription_models.dart';
import '../../subscription_list_view_model.dart';
import 'subscription_filter_chip.dart';

/// "Filtrele ve sırala" alt sayfasının içeriği. Seçimler üst ekrana
/// geri çağrılarla iletilir; sayfayı kapatmak çağıranın sorumluluğudur.
class SubscriptionFilterSheet extends StatelessWidget {
  const SubscriptionFilterSheet({
    required this.category,
    required this.sort,
    required this.hasArchived,
    required this.onCategory,
    required this.onSort,
    required this.onOpenArchive,
    required this.onImportCsv,
    super.key,
  });

  final SubscriptionCategory? category;
  final SubscriptionSortOption sort;
  final bool hasArchived;
  final ValueChanged<SubscriptionCategory?> onCategory;
  final ValueChanged<SubscriptionSortOption> onSort;
  final VoidCallback onOpenArchive;
  final VoidCallback onImportCsv;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Filtrele ve sırala', style: textTheme.titleLarge),
            const SizedBox(height: 20),
            Text('Kategori', style: textTheme.titleSmall),
            const SizedBox(height: 10),
            _categoryChips(),
            const SizedBox(height: 20),
            Text('Sıralama', style: textTheme.titleSmall),
            _sortOptions(),
            const SizedBox(height: 8),
            _links(),
          ],
        ),
      ),
    );
  }

  Widget _categoryChips() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        SubscriptionFilterChip(
          label: 'Tümü',
          selected: category == null,
          onTap: () => onCategory(null),
        ),
        for (final c in SubscriptionCategory.values)
          SubscriptionFilterChip(
            label: c.label,
            selected: category == c,
            onTap: () => onCategory(c),
          ),
      ],
    );
  }

  Widget _sortOptions() {
    return RadioGroup<SubscriptionSortOption>(
      groupValue: sort,
      onChanged: (value) {
        if (value != null) onSort(value);
      },
      child: Column(
        children: [
          for (final option in SubscriptionSortOption.values)
            RadioListTile<SubscriptionSortOption>(
              contentPadding: EdgeInsets.zero,
              value: option,
              title: Text(option.label),
            ),
        ],
      ),
    );
  }

  Widget _links() {
    return Row(
      children: [
        if (hasArchived)
          TextButton.icon(
            onPressed: onOpenArchive,
            icon: const Icon(Icons.archive_outlined),
            label: const Text('Arşiv'),
          ),
        const Spacer(),
        TextButton.icon(
          onPressed: onImportCsv,
          icon: const Icon(Icons.upload_file_outlined),
          label: const Text('CSV içe aktar'),
        ),
      ],
    );
  }
}
