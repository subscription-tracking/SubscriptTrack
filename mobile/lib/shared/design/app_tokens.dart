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

  /// Bottom clears the docked bottom nav for real — [AppSizes.bottomNavHeight]
  /// plus this device's actual safe-area inset (gesture bar / home
  /// indicator), not a guessed constant — with a bit of breathing room on
  /// top. Same top/horizontal everywhere so scroll padding never visibly
  /// jumps between tabs.
  static EdgeInsets screenWithBottomNav(BuildContext context) {
    final safeBottom = MediaQuery.paddingOf(context).bottom;
    return EdgeInsets.fromLTRB(
      lg,
      md,
      lg,
      AppSizes.bottomNavHeight + safeBottom + xl,
    );
  }
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

  /// The docked bottom nav's own content height, excluding the safe-area
  /// inset it also reserves (see BottomNavigation). Single source of truth
  /// so scroll padding can clear the real bar instead of a guess.
  static const bottomNavHeight = 64.0;

  /// The shared tall TopBar's height (icon + subtitle + title row).
  static const topBarHeight = 88.0;
}
