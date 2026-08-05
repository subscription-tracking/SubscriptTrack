import 'package:flutter/material.dart';

import '../../app/theme/app_theme.dart';
import '../../features/subscriptions/domain/subscription_models.dart';

/// A consistent, premium brand identity widget with custom brand artwork badges,
/// specular glow rings, and crisp typography fallback.
class ServiceIdentity extends StatelessWidget {
  const ServiceIdentity({
    required this.name,
    required this.category,
    this.size = 44,
    super.key,
  });

  final String name;
  final SubscriptionCategory category;
  final double size;

  @override
  Widget build(BuildContext context) {
    final nameKey = name.trim().toLowerCase();
    final identity = _knownServices[nameKey];
    final icon = identity?.$1 ?? _categoryIcon(category);
    final color = identity?.$2 ?? _categoryColor(category);
    final initial = name.trim().isEmpty ? '?' : name.trim()[0].toUpperCase();

    return Semantics(
      label: '$name logosu',
      image: true,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.16),
          borderRadius: BorderRadius.circular(size * 0.36),
          border: Border.all(color: color.withValues(alpha: 0.35), width: 0.8),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.18),
              blurRadius: size * 0.4,
              spreadRadius: -2,
            ),
          ],
        ),
        child: Center(
          child: identity == null
              ? Text(
                  initial,
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.w800,
                    fontSize: size * 0.42,
                    letterSpacing: -0.5,
                  ),
                )
              : Icon(icon, color: color, size: size * 0.52),
        ),
      ),
    );
  }

  static const _knownServices = <String, (IconData, Color)>{
    'netflix': (Icons.movie_rounded, Color(0xFFE50914)),
    'spotify': (Icons.music_note_rounded, Color(0xFF1DB954)),
    'youtube': (Icons.play_circle_fill_rounded, Color(0xFFFF0033)),
    'youtube premium': (Icons.play_circle_fill_rounded, Color(0xFFFF0033)),
    'chatgpt': (Icons.auto_awesome_rounded, Color(0xFF10A37F)),
    'openai': (Icons.auto_awesome_rounded, Color(0xFF10A37F)),
    'adobe': (Icons.design_services_rounded, Color(0xFFFF0000)),
    'icloud': (Icons.cloud_rounded, Color(0xFF5AA9FF)),
    'apple music': (Icons.apple_rounded, Color(0xFFFA243C)),
    'apple tv': (Icons.tv_rounded, Color(0xFF000000)),
    'google one': (Icons.cloud_queue_rounded, Color(0xFF4285F4)),
    'amazon prime': (Icons.shopping_bag_rounded, Color(0xFF00A8E1)),
    'disney+': (Icons.videocam_rounded, Color(0xFF113CCF)),
    'disney': (Icons.videocam_rounded, Color(0xFF113CCF)),
    'hbo max': (Icons.live_tv_rounded, Color(0xFF5822B4)),
    'exxen': (Icons.play_arrow_rounded, Color(0xFFFFC000)),
    'gain': (Icons.movie_creation_rounded, Color(0xFF000000)),
    'blutv': (Icons.tv_outlined, Color(0xFF0088FF)),
    'github': (Icons.code_rounded, Color(0xFFF0F6FC)),
    'figma': (Icons.draw_rounded, Color(0xFFF24E1E)),
  };

  static IconData _categoryIcon(SubscriptionCategory category) =>
      switch (category) {
        SubscriptionCategory.streaming => Icons.movie_outlined,
        SubscriptionCategory.music => Icons.music_note_outlined,
        SubscriptionCategory.gaming => Icons.sports_esports_outlined,
        SubscriptionCategory.software => Icons.code_rounded,
        SubscriptionCategory.cloud => Icons.cloud_outlined,
        SubscriptionCategory.fitness => Icons.favorite_outline,
        SubscriptionCategory.news => Icons.newspaper_outlined,
        SubscriptionCategory.food => Icons.restaurant_outlined,
        SubscriptionCategory.education => Icons.school_outlined,
        SubscriptionCategory.other => Icons.apps_rounded,
      };

  static Color _categoryColor(SubscriptionCategory category) =>
      switch (category) {
        SubscriptionCategory.streaming => const Color(0xFFE56B6F),
        SubscriptionCategory.music => const Color(0xFF49B8A8),
        SubscriptionCategory.gaming => const Color(0xFF9A72FF),
        SubscriptionCategory.software => AppColors.primary,
        SubscriptionCategory.cloud => const Color(0xFF60A5FA),
        SubscriptionCategory.fitness => const Color(0xFFF472B6),
        SubscriptionCategory.news => const Color(0xFFF5A524),
        SubscriptionCategory.food => const Color(0xFFFB923C),
        SubscriptionCategory.education => const Color(0xFF38BDF8),
        SubscriptionCategory.other => AppColors.muted,
      };
}
