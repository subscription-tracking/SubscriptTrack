import 'dart:async';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

/// A soft gradient wash + two blurred accent blobs, used behind auth and
/// onboarding screens for a consistent "premium" brand feel instead of a
/// flat surface color.
class AmbientBackground extends StatelessWidget {
  const AmbientBackground({
    required this.child,
    this.accent,
    this.bgColor,
    super.key,
  });

  final Widget child;
  final Color? accent;
  final Color? bgColor;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final accentColor = accent ?? cs.primary;
    final wash = bgColor ?? const Color(0xFF0C0E2A);

    return Stack(
      children: [
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(0, -0.6),
                radius: 1.1,
                colors: [wash, cs.surface],
              ),
            ),
          ),
        ),
        Positioned.fill(
          // RepaintBoundary: without this, anything that repaints inside
          // `child` (a blinking text cursor, a setState from typing) forces
          // the expensive blur below to re-rasterize on the same frame.
          child: RepaintBoundary(
            child: IgnorePointer(
              child: Stack(
                children: [
                  Positioned(
                    top: -120,
                    right: -90,
                    child: _blob(accentColor, 220, 0.16),
                  ),
                  Positioned(
                    bottom: -90,
                    left: -100,
                    child: _blob(accentColor, 200, 0.12),
                  ),
                ],
              ),
            ),
          ),
        ),
        child,
      ],
    );
  }

  Widget _blob(Color color, double size, double opacity) => ImageFiltered(
        imageFilter: ui.ImageFilter.blur(sigmaX: 22, sigmaY: 22),
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [
                color.withValues(alpha: opacity),
                color.withValues(alpha: 0),
              ],
              stops: const [0.3, 1.0],
            ),
          ),
        ),
      );
}

/// The small "• SubscriptTrack" brand row used across onboarding, the top
/// bar and now the auth screens.
class BrandMark extends StatelessWidget {
  const BrandMark({this.color, super.key});
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final labelColor = color ?? cs.onSurface.withValues(alpha: 0.55);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: cs.primary, shape: BoxShape.circle),
        ),
        const SizedBox(width: 8),
        Text(
          'SubscriptTrack',
          style: TextStyle(
            color: labelColor,
            fontWeight: FontWeight.w700,
            fontSize: 14,
            letterSpacing: -0.2,
          ),
        ),
      ],
    );
  }
}

/// A glowing icon orb — circular tinted container with a soft shadow halo,
/// used as the anchor visual on onboarding and auth screens.
class GlowOrb extends StatelessWidget {
  const GlowOrb({required this.icon, this.color, this.size = 88, super.key});
  final IconData icon;
  final Color? color;
  final double size;

  @override
  Widget build(BuildContext context) {
    final tint = color ?? Theme.of(context).colorScheme.primary;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: tint.withValues(alpha: 0.1),
        border: Border.all(color: tint.withValues(alpha: 0.28), width: 1),
        boxShadow: [
          BoxShadow(
            color: tint.withValues(alpha: 0.28),
            blurRadius: 48,
            spreadRadius: 4,
          ),
        ],
      ),
      child: Icon(icon, size: size * 0.46, color: tint),
    );
  }
}

/// Fades + slides its child up on first build.
class EntranceFade extends StatefulWidget {
  const EntranceFade(
      {required this.child, this.delay = Duration.zero, super.key});
  final Widget child;
  final Duration delay;

  @override
  State<EntranceFade> createState() => _EntranceFadeState();
}

class _EntranceFadeState extends State<EntranceFade>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _fade;
  late final Animation<Offset> _slide;
  Timer? _startTimer;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 550));
    _fade = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _slide = Tween(begin: const Offset(0, 0.06), end: Offset.zero)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic));
    _startTimer = Timer(widget.delay, () {
      if (mounted) _ctrl.forward();
    });
  }

  @override
  void dispose() {
    _startTimer?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(position: _slide, child: widget.child),
    );
  }
}
