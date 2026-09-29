import 'package:flutter/material.dart';

class SubscriptionListHeader extends StatelessWidget {
  const SubscriptionListHeader({
    required this.searchController,
    required this.onFilterTap,
    required this.onAddTap,
    super.key,
  });

  final TextEditingController searchController;
  final VoidCallback onFilterTap;
  final VoidCallback onAddTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 10),
      child: Row(
        children: [
          Expanded(
            child: TextField(
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
          ),
          const SizedBox(width: 8),
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
    );
  }
}
