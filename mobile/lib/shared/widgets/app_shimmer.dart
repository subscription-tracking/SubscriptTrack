import 'package:flutter/material.dart';
import '../../app/theme/app_theme.dart';

/// Shimmer loading placeholder for glass cards and lists.
class AppShimmer extends StatefulWidget {
  const AppShimmer({
    required this.width,
    required this.height,
    this.borderRadius = 16,
    super.key,
  });

  final double width;
  final double height;
  final double borderRadius;

  @override
  State<AppShimmer> createState() => _AppShimmerState();
}

class _AppShimmerState extends State<AppShimmer>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              begin: Alignment(-1.0 + (_controller.value * 3.0), -0.3),
              end: Alignment(1.0 + (_controller.value * 3.0), 0.3),
              colors: [
                AppColors.surfaceHigh,
                AppColors.surfaceHigh.withValues(alpha: 0.4),
                AppColors.surfaceHigh,
              ],
              stops: const [0.0, 0.5, 1.0],
            ),
            border: Border.all(color: AppColors.border, width: 0.5),
          ),
        );
      },
    );
  }
}
