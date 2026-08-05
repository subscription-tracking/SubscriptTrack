import 'package:flutter/material.dart';

import '../../app/theme/app_theme.dart';
import '../design/app_tokens.dart';
import 'app_surface.dart';

class AppEmptyState extends StatelessWidget {
  const AppEmptyState({
    required this.icon,
    required this.title,
    required this.description,
    this.actionLabel,
    this.onAction,
    this.compact = false,
    super.key,
  });

  final IconData icon;
  final String title;
  final String description;
  final String? actionLabel;
  final VoidCallback? onAction;
  final bool compact;

  @override
  Widget build(BuildContext context) => AppSurface(
        padding: EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: compact ? AppSpacing.xl : AppSpacing.xxl,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: compact ? 32 : 40, color: AppColors.onSurfaceVar),
            const SizedBox(height: AppSpacing.sm),
            Text(title,
                textAlign: TextAlign.center,
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: AppSpacing.xs),
            Text(description,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: AppSpacing.lg),
              FilledButton.icon(
                onPressed: onAction,
                icon: const Icon(Icons.add),
                label: Text(actionLabel!),
              ),
            ],
          ],
        ),
      );
}
