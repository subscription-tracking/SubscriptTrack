import 'package:flutter/material.dart';

/// A premium touch feedback widget that provides an elastic spring scale effect
/// on tap down and release, removing the flat "prototype" feel of standard taps.
class AppBounceable extends StatefulWidget {
  const AppBounceable({
    required this.child,
    required this.onTap,
    this.scaleFactor = 0.96,
    this.duration = const Duration(milliseconds: 120),
    super.key,
  });

  final Widget child;
  final VoidCallback? onTap;
  final double scaleFactor;
  final Duration duration;

  @override
  State<AppBounceable> createState() => _AppBounceableState();
}

class _AppBounceableState extends State<AppBounceable>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
    );
    _scale = Tween<double>(begin: 1.0, end: widget.scaleFactor).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutQuad,
        reverseCurve: Curves.easeInQuad,
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails details) {
    if (widget.onTap != null) {
      _controller.forward();
    }
  }

  void _onTapUp(TapUpDetails details) {
    if (widget.onTap != null) {
      _controller.reverse();
    }
  }

  void _onTapCancel() {
    if (widget.onTap != null) {
      _controller.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      onTap: widget.onTap,
      child: ScaleTransition(
        scale: _scale,
        child: widget.child,
      ),
    );
  }
}
