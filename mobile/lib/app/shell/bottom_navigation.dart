import 'package:flutter/material.dart';

import '../../shared/design/app_tokens.dart';

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

    return Container(
      height: AppSizes.bottomNavHeight + bottom,
      padding: EdgeInsets.only(bottom: bottom),
      decoration: BoxDecoration(
        color: cs.surfaceContainer,
        border: Border(top: BorderSide(color: cs.outlineVariant, width: 0.5)),
      ),
      child: Row(
        children: List.generate(_items.length, (i) {
          final active = i == currentIndex;
          final item = _items[i];
          final color = active ? cs.primary : cs.onSurfaceVariant;
          return Expanded(
            child: Semantics(
              label: item.$3,
              excludeSemantics: true,
              button: true,
              selected: active,
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => onChanged(i),
                  child: SizedBox(
                    height: AppSizes.bottomNavHeight,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          curve: Curves.easeOut,
                          width: active ? 30 : 0,
                          height: 2,
                          margin: const EdgeInsets.only(bottom: 7),
                          decoration: BoxDecoration(
                            color: cs.primary,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        Icon(active ? item.$1 : item.$2,
                            color: color, size: 22),
                        const SizedBox(height: 3),
                        Text(
                          item.$3,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: color,
                            fontSize: 11,
                            fontWeight:
                                active ? FontWeight.w700 : FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}
