import 'package:flutter/material.dart';

class PillTab {
  const PillTab(this.label, this.count);
  final String label;
  final int count;
}

class PillTabBar extends StatefulWidget {
  const PillTabBar({required this.controller, required this.tabs, super.key});

  final TabController controller;
  final List<PillTab> tabs;

  @override
  State<PillTabBar> createState() => _PillTabBarState();
}

class _PillTabBarState extends State<PillTabBar> {
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
                  key: Key('subscription-status-tab-${tab.label}'),
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
