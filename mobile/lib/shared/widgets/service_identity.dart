import 'package:flutter/material.dart';

import '../../app/theme/app_theme.dart';
import '../../features/subscriptions/domain/subscription_models.dart';

/// A consistent, privacy-safe service identity. Brand imagery can be supplied
/// later from a verified local catalogue; until then we never fetch arbitrary
/// remote logos or misrepresent a user-created service.
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
    final identity = _knownServices[name.trim().toLowerCase()];
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
          color: color.withValues(alpha: 0.14),
          borderRadius: BorderRadius.circular(size * .28),
          border: Border.all(color: color.withValues(alpha: .28)),
        ),
        child: Center(
          child: identity == null
              ? Text(initial,
                  style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.w800,
                      fontSize: size * .38))
              : Icon(icon, color: color, size: size * .52),
        ),
      ),
    );
  }

  static const _knownServices = <String, (IconData, Color)>{
    'netflix': (Icons.movie_rounded, Color(0xFFE50914)),
    'spotify': (Icons.music_note_rounded, Color(0xFF1DB954)),
    'youtube': (Icons.play_circle_fill_rounded, Color(0xFFFF0033)),
    'chatgpt': (Icons.auto_awesome_rounded, Color(0xFF10A37F)),
    'adobe': (Icons.design_services_rounded, Color(0xFFFF0000)),
    'icloud': (Icons.cloud_rounded, Color(0xFF5AA9FF)),
    'google one': (Icons.cloud_queue_rounded, Color(0xFF4285F4)),
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
