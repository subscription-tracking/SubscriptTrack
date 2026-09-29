import 'package:flutter/material.dart';

class CurrencySelector extends StatelessWidget {
  const CurrencySelector({
    required this.currencies,
    required this.selected,
    required this.onChanged,
    super.key,
  });

  final List<String> currencies;
  final String selected;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: currencies.map((curr) {
          final isSelected = curr == selected;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(curr),
              selected: isSelected,
              onSelected: (_) => onChanged(curr),
              selectedColor: cs.primary.withValues(alpha: 0.2),
              side: BorderSide(
                color: isSelected
                    ? cs.primary
                    : cs.outlineVariant.withValues(alpha: 0.5),
                width: 0.8,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
