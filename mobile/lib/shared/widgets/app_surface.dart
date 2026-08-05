import 'package:flutter/material.dart';

import '../../app/theme/app_theme.dart';
import '../design/app_tokens.dart';

class AppSurface extends StatelessWidget {
  const AppSurface({
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.md),
    this.margin,
    this.borderRadius = AppRadius.medium,
    super.key,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final BorderRadius borderRadius;

  @override
  Widget build(BuildContext context) => Container(
        margin: margin,
        padding: padding,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: borderRadius,
          border: Border.all(color: AppColors.border),
        ),
        child: child,
      );
}
