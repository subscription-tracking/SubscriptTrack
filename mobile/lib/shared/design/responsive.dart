import 'package:flutter/widgets.dart';

/// Material 3 pencere sınıfı eşikleri (dp). Test 50: uygulama genelinde
/// dağınık `MediaQuery` kontrolleri yerine tek bir merkezi breakpoint
/// stratejisi.
class AppBreakpoints {
  AppBreakpoints._();

  static const compact = 600.0;
  static const medium = 840.0;

  static bool isCompact(BuildContext context) =>
      MediaQuery.sizeOf(context).width < compact;

  static bool isExpanded(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= medium;
}

/// Geniş ekranlarda (tablet/masaüstü) içeriği okunabilir bir genişlikte
/// ortalar; dar ekranlarda (telefon) tam genişlik davranışını korur. Liste,
/// form ve detay ekranlarının tablet genişliğinde uçtan uca gerilip
/// taşmasını/okunaksızlaşmasını önler (Test 50).
class ResponsiveCenter extends StatelessWidget {
  const ResponsiveCenter({
    required this.child,
    this.maxWidth = 640,
    super.key,
  });

  final Widget child;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    if (width <= maxWidth) return child;
    return Align(
      alignment: Alignment.topCenter,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: child,
      ),
    );
  }
}
