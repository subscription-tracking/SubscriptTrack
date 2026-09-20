import 'dart:ui';

import 'package:flutter/material.dart';

class BottomNavigation extends StatelessWidget {
  const BottomNavigation({
    required this.currentIndex,
    required this.onChanged,
    super.key,
  });

  final int currentIndex;
  final ValueChanged<int> onChanged;

  static const _items = [
    (Icons.home_rounded, Icons.home_outlined, 'Ana Sayfa'),
    (Icons.grid_view_rounded, Icons.grid_view_outlined, 'Abonelikler'),
    (Icons.bar_chart_rounded, Icons.bar_chart_outlined, 'İstatistikler'),
    (Icons.person_rounded, Icons.person_outline, 'Profil'),
  ];

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final bottom = MediaQuery.of(context).padding.bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, bottom + 12),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(100),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            height: 64,
            decoration: BoxDecoration(
              color: Theme.of(context)
                  .colorScheme
                  .surfaceContainerHigh
                  .withValues(alpha: 0.94),
              borderRadius: BorderRadius.circular(100),
              border: Border.all(
                color: cs.outlineVariant,
                width: 0.5,
              ),
            ),
            child: Row(
              children: List.generate(_items.length, (i) {
                final active = i == currentIndex;
                final item = _items[i];
                return Expanded(
                  child: Semantics(
                    label: item.$3,
                    button: true,
                    selected: active,
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => onChanged(i),
                        borderRadius: BorderRadius.circular(100),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          curve: Curves.easeInOut,
                          constraints: const BoxConstraints(minHeight: 48),
                          padding: EdgeInsets.symmetric(
                            horizontal: active ? 10 : 18,
                            vertical: 10,
                          ),
                          decoration: active
                              ? BoxDecoration(
                                  color: cs.onSurface.withValues(alpha: 0.09),
                                  borderRadius: BorderRadius.circular(100),
                                )
                              : null,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(active ? item.$1 : item.$2,
                                  color: active
                                      ? cs.primary
                                      : cs.onSurfaceVariant,
                                  size: 22),
                              if (active) ...[
                                const SizedBox(width: 6),
                                Flexible(
                                  child: Text(item.$3,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                          color: cs.primary,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: 0.2)),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}
