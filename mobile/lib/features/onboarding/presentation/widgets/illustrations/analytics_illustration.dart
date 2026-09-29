import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';

class AnalyticsIllustration extends StatefulWidget {
  const AnalyticsIllustration({super.key});

  @override
  State<AnalyticsIllustration> createState() => _AnalyticsIllustrationState();
}

class _AnalyticsIllustrationState extends State<AnalyticsIllustration>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _sweep;
  Timer? _startTimer;

  static const _segments = [
    (0.42, Color(0xFFF5A524)),
    (0.30, Color(0xFF7377F5)),
    (0.28, Color(0xFF16A36A)),
  ];

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1100));
    _sweep = CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic);
    _startTimer = Timer(const Duration(milliseconds: 150), () {
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
    const accent = Color(0xFFF5A524);
    return SizedBox(
      width: 220,
      height: 220,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: 118,
            height: 118,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: accent.withValues(alpha: 0.24),
                  blurRadius: 56,
                  spreadRadius: 6,
                ),
              ],
            ),
          ),
          AnimatedBuilder(
            animation: _sweep,
            builder: (context, _) => CustomPaint(
              size: const Size(190, 190),
              painter:
                  _RingPainter(progress: _sweep.value, segments: _segments),
            ),
          ),
          FadeTransition(
            opacity: _sweep,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.trending_down_rounded,
                    color: accent, size: 26),
                const SizedBox(height: 4),
                Text(
                  '%18',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                ),
                Text(
                  'tasarruf',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter({required this.progress, required this.segments});
  final double progress;
  final List<(double, Color)> segments;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 10;
    final strokeWidth = size.width * 0.09;
    var start = -math.pi / 2;
    for (final (fraction, color) in segments) {
      final sweep = fraction * 2 * math.pi * progress;
      final paint = Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        start,
        sweep,
        false,
        paint,
      );
      start += fraction * 2 * math.pi;
    }
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) =>
      oldDelegate.progress != progress;
}

// ─── Currency page ──────────────────────────────────────────────────────────
