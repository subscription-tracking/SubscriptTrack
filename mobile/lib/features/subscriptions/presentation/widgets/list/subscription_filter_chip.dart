import 'package:flutter/material.dart';

class SubscriptionFilterChip extends StatelessWidget {
  const SubscriptionFilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
    super.key,
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
