import 'package:flutter/material.dart';

import '../../../../../shared/widgets/service_identity.dart';
import '../../../../subscriptions/domain/subscription_models.dart';
import '../onboarding_motion.dart';

class SubscriptionsIllustration extends StatelessWidget {
  const SubscriptionsIllustration({super.key});

  @override
  Widget build(BuildContext context) {
    const accent = Color(0xFF7377F5);
    return SizedBox(
      width: 220,
      height: 220,
      child: Stack(
        alignment: Alignment.center,
        children: [
          const OnboardingGlowOrb(
            color: accent,
            icon: Icons.account_balance_wallet_rounded,
          ),
          _badge('Netflix', SubscriptionCategory.streaming, 46, 0,
              top: 4, left: 10),
          _badge('Spotify', SubscriptionCategory.music, 44, 1.4,
              top: 10, right: 0),
          _badge('iCloud', SubscriptionCategory.cloud, 42, 2.6,
              bottom: 14, left: 0),
          _badge('Disney+', SubscriptionCategory.streaming, 40, 4.0,
              bottom: 0, right: 16),
        ],
      ),
    );
  }

  /// Logoyu yavaşça sallanan ("bob") konumlandırılmış rozet olarak döndürür.
  Widget _badge(
    String name,
    SubscriptionCategory category,
    double size,
    double phase, {
    double? top,
    double? bottom,
    double? left,
    double? right,
  }) {
    return Positioned(
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      child: OnboardingBob(
        phase: phase,
        child: ServiceIdentity(name: name, category: category, size: size),
      ),
    );
  }
}
