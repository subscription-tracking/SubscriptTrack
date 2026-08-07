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
    // Streaming
    'netflix': (Icons.movie_rounded, Color(0xFFE50914)),
    'disney+': (Icons.videocam_rounded, Color(0xFF113CCF)),
    'disney': (Icons.videocam_rounded, Color(0xFF113CCF)),
    'hbo max': (Icons.live_tv_rounded, Color(0xFF5822B4)),
    'hbo': (Icons.live_tv_rounded, Color(0xFF5822B4)),
    'max': (Icons.live_tv_rounded, Color(0xFF002BE7)),
    'amazon prime': (Icons.shopping_bag_rounded, Color(0xFF00A8E1)),
    'prime video': (Icons.shopping_bag_rounded, Color(0xFF00A8E1)),
    'apple tv': (Icons.tv_rounded, Color(0xFFB4B4B4)),
    'apple tv+': (Icons.tv_rounded, Color(0xFFB4B4B4)),
    'exxen': (Icons.play_arrow_rounded, Color(0xFFFFC000)),
    'gain': (Icons.movie_creation_rounded, Color(0xFFE63946)),
    'blutv': (Icons.tv_outlined, Color(0xFF0088FF)),
    'mubi': (Icons.theaters_rounded, Color(0xFF0C2F4C)),
    // Music
    'spotify': (Icons.music_note_rounded, Color(0xFF1DB954)),
    'apple music': (Icons.music_note_rounded, Color(0xFFFA243C)),
    'youtube music': (Icons.music_note_rounded, Color(0xFFFF0000)),
    'tidal': (Icons.queue_music_rounded, Color(0xFF000000)),
    'deezer': (Icons.music_video_rounded, Color(0xFFFF5F00)),
    // Productivity & AI
    'chatgpt': (Icons.auto_awesome_rounded, Color(0xFF10A37F)),
    'openai': (Icons.auto_awesome_rounded, Color(0xFF10A37F)),
    'claude': (Icons.psychology_rounded, Color(0xFFCC785C)),
    'notion': (Icons.article_rounded, Color(0xFFE8E8E8)),
    'obsidian': (Icons.hub_rounded, Color(0xFF7C3AED)),
    'linear': (Icons.electric_bolt_rounded, Color(0xFF5E6AD2)),
    'jira': (Icons.view_kanban_rounded, Color(0xFF0052CC)),
    'slack': (Icons.forum_rounded, Color(0xFF4A154B)),
    // Creative
    'adobe': (Icons.design_services_rounded, Color(0xFFFF0000)),
    'figma': (Icons.draw_rounded, Color(0xFFF24E1E)),
    'canva': (Icons.brush_rounded, Color(0xFF00C4CC)),
    'sketch': (Icons.design_services_rounded, Color(0xFFFDAD00)),
    'midjourney': (Icons.auto_fix_high_rounded, Color(0xFF5865F2)),
    // Cloud & Storage
    'icloud': (Icons.cloud_rounded, Color(0xFF5AA9FF)),
    'google one': (Icons.cloud_queue_rounded, Color(0xFF4285F4)),
    'dropbox': (Icons.cloud_download_rounded, Color(0xFF0061FF)),
    'onedrive': (Icons.cloud_rounded, Color(0xFF0078D4)),
    // Developer
    'github': (Icons.code_rounded, Color(0xFFF0F6FC)),
    'gitlab': (Icons.code_rounded, Color(0xFFFC6D26)),
    'vercel': (Icons.rocket_launch_rounded, Color(0xFFE8E8E8)),
    'netlify': (Icons.cloud_rounded, Color(0xFF00C7B7)),
    // YouTube
    'youtube': (Icons.play_circle_fill_rounded, Color(0xFFFF0033)),
    'youtube premium': (Icons.play_circle_fill_rounded, Color(0xFFFF0033)),
    // Gaming
    'xbox game pass': (Icons.sports_esports_rounded, Color(0xFF107C10)),
    'playstation plus': (Icons.videogame_asset_rounded, Color(0xFF003087)),
    'ea play': (Icons.sports_esports_rounded, Color(0xFFFF4747)),
    'nintendo switch online':
        (Icons.sports_esports_rounded, Color(0xFFE60012)),
    // Health & Fitness
    'strava': (Icons.directions_run_rounded, Color(0xFFFC4C02)),
    'myfitnesspal': (Icons.monitor_heart_rounded, Color(0xFF00B0FF)),
    // VPN & Security
    'nordvpn': (Icons.security_rounded, Color(0xFF4687FF)),
    'expressvpn': (Icons.vpn_lock_rounded, Color(0xFFDA3940)),
    '1password': (Icons.lock_rounded, Color(0xFF1A8CFF)),
    'lastpass': (Icons.password_rounded, Color(0xFFD32D27)),
    // Password & Auth
    'bitwarden': (Icons.shield_rounded, Color(0xFF175DDC)),
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
