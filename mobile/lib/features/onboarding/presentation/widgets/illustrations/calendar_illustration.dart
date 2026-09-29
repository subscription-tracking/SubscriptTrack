import 'package:flutter/material.dart';

class CalendarIllustration extends StatefulWidget {
  const CalendarIllustration({super.key});

  @override
  State<CalendarIllustration> createState() => _CalendarIllustrationState();
}

class _CalendarIllustrationState extends State<CalendarIllustration>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  static const _accent = Color(0xFF16A36A);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return SizedBox(
      width: 220,
      height: 200,
      child: Stack(
        alignment: Alignment.center,
        children: [
          _calendarCard(cs),
          // Pulsing "renewal due" badge anchored over the highlighted cell.
          Positioned(
            right: 22,
            bottom: 34,
            child: RepaintBoundary(
              child: AnimatedBuilder(
                animation: _pulse,
                builder: (context, child) {
                  final scale = 1 + _pulse.value * 0.18;
                  return Transform.scale(scale: scale, child: child);
                },
                child: _dueBadge(cs),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _calendarCard(ColorScheme cs) {
    return Container(
      width: 190,
      height: 178,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: _accent.withValues(alpha: 0.22)),
        boxShadow: [
          BoxShadow(
            color: _accent.withValues(alpha: 0.22),
            blurRadius: 48,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 40,
                height: 8,
                decoration: BoxDecoration(
                  color: cs.onSurface.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              Icon(Icons.chevron_right_rounded,
                  size: 16, color: cs.onSurface.withValues(alpha: 0.3)),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(child: _dayGrid(cs)),
        ],
      ),
    );
  }

  Widget _dayGrid(ColorScheme cs) {
    return GridView.count(
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 7,
      mainAxisSpacing: 5,
      crossAxisSpacing: 5,
      children: List.generate(21, (i) {
        final isDue = i == 16;
        return Container(
          decoration: BoxDecoration(
            color: isDue ? _accent : cs.onSurface.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(5),
          ),
        );
      }),
    );
  }

  Widget _dueBadge(ColorScheme cs) {
    return Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(
        color: _accent,
        shape: BoxShape.circle,
        border: Border.all(color: cs.surface, width: 3),
        boxShadow: [
          BoxShadow(
            color: _accent.withValues(alpha: 0.5),
            blurRadius: 16,
          ),
        ],
      ),
      child: const Icon(Icons.notifications_rounded,
          size: 15, color: Colors.white),
    );
  }
}

// ─── Slide 3 illustration: an animated spend-breakdown ring ────────────────
