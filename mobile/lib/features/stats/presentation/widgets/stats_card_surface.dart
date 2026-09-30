import 'package:flutter/material.dart';

/// İstatistik ekranındaki kartların ortak yüzeyi (yuvarlatılmış, çerçeveli).
class StatsCardSurface extends StatelessWidget {
  const StatsCardSurface({required this.child, this.padding = 20, super.key});

  final Widget child;
  final double padding;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: cs.surfaceContainer,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: cs.outlineVariant.withValues(alpha: 0.6),
          width: 0.8,
        ),
      ),
      padding: EdgeInsets.all(padding),
      child: child,
    );
  }
}
