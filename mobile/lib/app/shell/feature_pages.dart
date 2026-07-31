import 'package:flutter/material.dart';

// Henüz implement edilmemiş ekranlar için genel placeholder widget.
class FeaturePage extends StatelessWidget {
  const FeaturePage({
    required this.title,
    required this.icon,
    required this.description,
    this.actions = const [],
    super.key,
  });

  final String title;
  final IconData icon;
  final String description;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const SizedBox(height: 16),
          Icon(icon, size: 56, color: Theme.of(context).colorScheme.primary),
          const SizedBox(height: 16),
          Text(title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(description,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(children: [
                Icon(Icons.inbox_outlined,
                    size: 42,
                    color: Theme.of(context).colorScheme.primary),
                const SizedBox(height: 12),
                const Text('Yakında geliyor'),
                const SizedBox(height: 6),
                Text(
                  'Bu özellik üzerinde çalışıyoruz.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ]),
            ),
          ),
          const SizedBox(height: 20),
          ...actions,
        ],
      );
}
