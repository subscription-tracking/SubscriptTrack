import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

import '../../app/theme/app_theme.dart';
import '../../features/subscriptions/domain/subscription_models.dart';

/// A consistent, premium brand identity widget.
///
/// For known services it shows the **real Font Awesome brand icon** with the
/// accurate brand colour inside a tinted container with a specular glow ring.
/// For unknown services it falls back to a category-specific Material icon or
/// the first-letter initial.
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
    final brand = _brandIcons[nameKey];
    final fallback = _fallbackIcons[nameKey];
    final color =
        brand?.$2 ?? fallback?.$2 ?? _categoryColor(context, category);
    final initial = name.trim().isEmpty ? '?' : name.trim()[0].toUpperCase();

    // Decide the inner content.
    Widget inner;
    if (brand != null) {
      // Known brand → Font Awesome brand icon via FaIcon widget.
      inner = Center(
        child: FaIcon(brand.$1, color: color, size: size * 0.48),
      );
    } else if (fallback != null) {
      // Known service but no FA icon → Material Icon.
      inner = Center(
        child: Icon(fallback.$1, color: color, size: size * 0.52),
      );
    } else {
      // Unknown → first-letter initial.
      inner = Center(
        child: Text(
          initial,
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.w800,
            fontSize: size * 0.42,
            letterSpacing: -0.5,
          ),
        ),
      );
    }

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
        child: inner,
      ),
    );
  }

  // ─── Font Awesome brand icons (FaIconData) ───────────────────────────
  static const _brandIcons = <String, (FaIconData, Color)>{
    // Streaming
    'amazon prime': (FontAwesomeIcons.amazon, Color(0xFF00A8E1)),
    'prime video': (FontAwesomeIcons.amazon, Color(0xFF00A8E1)),
    'apple tv': (FontAwesomeIcons.apple, Color(0xFFB4B4B4)),
    'apple tv+': (FontAwesomeIcons.apple, Color(0xFFB4B4B4)),
    'youtube': (FontAwesomeIcons.youtube, Color(0xFFFF0033)),
    'youtube premium': (FontAwesomeIcons.youtube, Color(0xFFFF0033)),
    // Music
    'spotify': (FontAwesomeIcons.spotify, Color(0xFF1DB954)),
    'apple music': (FontAwesomeIcons.itunes, Color(0xFFFA243C)),
    'youtube music': (FontAwesomeIcons.youtube, Color(0xFFFF0000)),
    'deezer': (FontAwesomeIcons.deezer, Color(0xFFFF5F00)),
    // Productivity
    'jira': (FontAwesomeIcons.jira, Color(0xFF0052CC)),
    'slack': (FontAwesomeIcons.slack, Color(0xFF4A154B)),
    // Creative
    'figma': (FontAwesomeIcons.figma, Color(0xFFF24E1E)),
    // Cloud
    'google one': (FontAwesomeIcons.google, Color(0xFF4285F4)),
    'dropbox': (FontAwesomeIcons.dropbox, Color(0xFF0061FF)),
    'onedrive': (FontAwesomeIcons.microsoft, Color(0xFF0078D4)),
    'icloud': (FontAwesomeIcons.apple, Color(0xFF5AA9FF)),
    // Developer
    'github': (FontAwesomeIcons.github, Color(0xFFF0F6FC)),
    'gitlab': (FontAwesomeIcons.gitlab, Color(0xFFFC6D26)),
    // Gaming
    'xbox game pass': (FontAwesomeIcons.xbox, Color(0xFF107C10)),
    'playstation plus': (FontAwesomeIcons.playstation, Color(0xFF003087)),
    // Health
    'strava': (FontAwesomeIcons.strava, Color(0xFFFC4C02)),
  };

  // ─── Material icon fallback for brands NOT in Font Awesome ───────────
  static const _fallbackIcons = <String, (IconData, Color)>{
    // Streaming
    'netflix': (Icons.movie_rounded, Color(0xFFE50914)),
    'disney+': (Icons.videocam_rounded, Color(0xFF113CCF)),
    'disney': (Icons.videocam_rounded, Color(0xFF113CCF)),
    'hbo max': (Icons.live_tv_rounded, Color(0xFF5822B4)),
    'hbo': (Icons.live_tv_rounded, Color(0xFF5822B4)),
    'max': (Icons.live_tv_rounded, Color(0xFF002BE7)),
    'exxen': (Icons.play_arrow_rounded, Color(0xFFFFC000)),
    'gain': (Icons.movie_creation_rounded, Color(0xFFE63946)),
    'blutv': (Icons.tv_outlined, Color(0xFF0088FF)),
    'mubi': (Icons.theaters_rounded, Color(0xFF0C2F4C)),
    // Music
    'tidal': (Icons.queue_music_rounded, Color(0xFF000000)),
    // AI
    'chatgpt': (Icons.auto_awesome_rounded, Color(0xFF10A37F)),
    'openai': (Icons.auto_awesome_rounded, Color(0xFF10A37F)),
    'claude': (Icons.psychology_rounded, Color(0xFFCC785C)),
    'notion': (Icons.article_rounded, Color(0xFFE8E8E8)),
    'obsidian': (Icons.hub_rounded, Color(0xFF7C3AED)),
    'linear': (Icons.electric_bolt_rounded, Color(0xFF5E6AD2)),
    'midjourney': (Icons.auto_fix_high_rounded, Color(0xFF5865F2)),
    // Creative
    'adobe': (Icons.design_services_rounded, Color(0xFFFF0000)),
    'canva': (Icons.brush_rounded, Color(0xFF00C4CC)),
    'sketch': (Icons.design_services_rounded, Color(0xFFFDAD00)),
    // Developer
    'vercel': (Icons.rocket_launch_rounded, Color(0xFFE8E8E8)),
    'netlify': (Icons.cloud_rounded, Color(0xFF00C7B7)),
    // Gaming
    'ea play': (Icons.sports_esports_rounded, Color(0xFFFF4747)),
    'nintendo switch online':
        (Icons.sports_esports_rounded, Color(0xFFE60012)),
    // Health
    'myfitnesspal': (Icons.monitor_heart_rounded, Color(0xFF00B0FF)),
    // VPN & Security
    'nordvpn': (Icons.security_rounded, Color(0xFF4687FF)),
    'expressvpn': (Icons.vpn_lock_rounded, Color(0xFFDA3940)),
    '1password': (Icons.lock_rounded, Color(0xFF1A8CFF)),
    'lastpass': (Icons.password_rounded, Color(0xFFD32D27)),
    'bitwarden': (Icons.shield_rounded, Color(0xFF175DDC)),
  };

  static Color _categoryColor(BuildContext context, SubscriptionCategory category) =>
      switch (category) {
        SubscriptionCategory.streaming => const Color(0xFFE56B6F),
        SubscriptionCategory.music => const Color(0xFF49B8A8),
        SubscriptionCategory.gaming => const Color(0xFF9A72FF),
        SubscriptionCategory.software => Theme.of(context).colorScheme.primary,
        SubscriptionCategory.cloud => const Color(0xFF60A5FA),
        SubscriptionCategory.fitness => const Color(0xFFF472B6),
        SubscriptionCategory.news => const Color(0xFFF5A524),
        SubscriptionCategory.food => const Color(0xFFFB923C),
        SubscriptionCategory.education => const Color(0xFF38BDF8),
        SubscriptionCategory.other => context.statusColors.muted,
      };
}
