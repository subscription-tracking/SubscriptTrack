import 'package:flutter/material.dart';

import '../../../../shared/widgets/ambient_background.dart' show EntranceFade;
import 'onboarding_motion.dart';

class CurrencyPage extends StatelessWidget {
  const CurrencyPage(
      {required this.selected, required this.onSelect, super.key});

  final String selected;
  final ValueChanged<String> onSelect;

  static const _options = [
    ('₺', 'Türk Lirası', 'TRY'),
    ('\$', 'ABD Doları', 'USD'),
    ('€', 'Euro', 'EUR'),
    ('£', 'İngiliz Sterlini', 'GBP'),
  ];

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          EntranceFade(child: _floatingChips(cs)),
          const SizedBox(height: 32),
          EntranceFade(
            delay: const Duration(milliseconds: 80),
            child: Text(
              'Para birimi seç',
              style: textTheme.headlineSmall
                  ?.copyWith(fontWeight: FontWeight.w800),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 8),
          EntranceFade(
            delay: const Duration(milliseconds: 120),
            child: Text(
              'Daha sonra ayarlardan değiştirebilirsin.',
              style: textTheme.bodyMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 28),
          EntranceFade(
            delay: const Duration(milliseconds: 160),
            child: Column(
              children: [
                for (final (symbol, name, code) in _options)
                  _CurrencyOption(
                    symbol: symbol,
                    name: name,
                    code: code,
                    selected: selected == symbol,
                    onTap: () => onSelect(symbol),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _floatingChips(ColorScheme cs) {
    return SizedBox(
      width: 190,
      height: 150,
      child: Stack(
        alignment: Alignment.center,
        children: [
          OnboardingGlowOrb(
            color: cs.primary,
            icon: Icons.currency_exchange_rounded,
          ),
          Positioned(
            top: 2,
            left: 6,
            child: OnboardingBob(phase: 0.6, child: _currencyChip(cs, '\$')),
          ),
          Positioned(
            top: 6,
            right: 0,
            child: OnboardingBob(phase: 2.2, child: _currencyChip(cs, '€')),
          ),
          Positioned(
            bottom: 0,
            left: 20,
            child: OnboardingBob(phase: 3.6, child: _currencyChip(cs, '£')),
          ),
        ],
      ),
    );
  }

  Widget _currencyChip(ColorScheme cs, String symbol) => Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: cs.surfaceContainerHigh,
          shape: BoxShape.circle,
          border: Border.all(color: cs.outlineVariant),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.12),
              blurRadius: 8,
            ),
          ],
        ),
        child: Center(
          child: Text(
            symbol,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 14,
              color: cs.onSurface,
            ),
          ),
        ),
      );
}

class _CurrencyOption extends StatelessWidget {
  const _CurrencyOption({
    required this.symbol,
    required this.name,
    required this.code,
    required this.selected,
    required this.onTap,
  });

  final String symbol;
  final String name;
  final String code;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: selected
                  ? cs.primary.withValues(alpha: 0.1)
                  : cs.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: selected
                    ? cs.primary.withValues(alpha: 0.5)
                    : cs.outlineVariant,
                width: selected ? 1.5 : 0.5,
              ),
            ),
            child: Row(
              children: [
                _symbolBadge(cs),
                const SizedBox(width: 12),
                Expanded(child: _labels(cs, textTheme)),
                if (selected)
                  Icon(Icons.check_circle_rounded, color: cs.primary, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _symbolBadge(ColorScheme cs) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: selected
            ? cs.primary.withValues(alpha: 0.14)
            : cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Center(
        child: Text(
          symbol,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: selected ? cs.primary : cs.onSurfaceVariant,
          ),
        ),
      ),
    );
  }

  Widget _labels(ColorScheme cs, TextTheme textTheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          name,
          style: textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: selected ? cs.onSurface : cs.onSurfaceVariant,
          ),
        ),
        Text(code, style: textTheme.bodySmall?.copyWith(fontSize: 11)),
      ],
    );
  }
}
