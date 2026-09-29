import 'dart:math' as math;

import 'package:flutter/material.dart';

class OnboardingBob extends StatefulWidget {
  const OnboardingBob({required this.child, this.phase = 0, super.key});
  final Widget child;
  final double phase;
  static const _amplitude = 6.0;

  @override
  State<OnboardingBob> createState() => _BobState();
}

class _BobState extends State<OnboardingBob>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2600),
    )..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // RepaintBoundary turns the per-frame offset change into a cheap
    // compositor-layer transform instead of repainting the icon (and
    // anything sharing its layer) every frame.
    return RepaintBoundary(
      child: AnimatedBuilder(
        animation: _ctrl,
        builder: (context, child) {
          final t = _ctrl.value * 2 * math.pi + widget.phase;
          return Transform.translate(
            offset: Offset(0, math.sin(t) * OnboardingBob._amplitude),
            child: child,
          );
        },
        child: widget.child,
      ),
    );
  }
}

class OnboardingGlowOrb extends StatelessWidget {
  const OnboardingGlowOrb({required this.color, required this.icon, super.key});
  final Color color;
  final IconData icon;
  static const _size = 118.0;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: _size,
      height: _size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: 0.1),
        border: Border.all(color: color.withValues(alpha: 0.28), width: 1),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.28),
            blurRadius: 56,
            spreadRadius: 6,
          ),
        ],
      ),
      child: Icon(icon, size: _size * 0.46, color: color),
    );
  }
}

// ─── Slide 2 illustration: a mini calendar mockup with a pulsing due date ──
