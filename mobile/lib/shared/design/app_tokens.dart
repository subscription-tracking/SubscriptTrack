import 'package:flutter/material.dart';

/// Shared layout values. Screens should compose these instead of inventing
/// one-off gutters, radii, and button heights.
abstract final class AppSpacing {
  static const xxs = 4.0;
  static const xs = 8.0;
  static const sm = 12.0;
  static const md = 16.0;
  static const lg = 20.0;
  static const xl = 24.0;
  static const xxl = 32.0;
  static const screen = EdgeInsets.symmetric(horizontal: lg);
  static const screenWithBottomNav = EdgeInsets.fromLTRB(lg, xs, lg, 260);
}

abstract final class AppRadius {
  static const small = BorderRadius.all(Radius.circular(14));
  static const medium = BorderRadius.all(Radius.circular(20));
  static const large = BorderRadius.all(Radius.circular(24));
  static const pill = BorderRadius.all(Radius.circular(100));
}

abstract final class AppSizes {
  static const minTouchTarget = 48.0;
  static const primaryButtonHeight = 50.0;
}
