import 'package:flutter/material.dart';

import '../../../../../shared/widgets/service_identity.dart';
import '../../../../subscriptions/domain/subscription_models.dart';
import '../onboarding_motion.dart';

class SubscriptionsIllustration extends StatelessWidget {
  const SubscriptionsIllustration({super.key});

  @override
  Widget build(BuildContext context) {
    const accent = Color(0xFF7377F5);
    return const SizedBox(
      width: 220,
      height: 220,
      child: Stack(
        alignment: Alignment.center,
        children: [
          OnboardingGlowOrb(
            color: accent,
            icon: Icons.account_balance_wallet_rounded,
          ),
          Positioned(
            top: 4,
            left: 10,
            child: OnboardingBob(
              phase: 0,
              child: ServiceIdentity(
                name: 'Netflix',
                category: SubscriptionCategory.streaming,
                size: 46,
              ),
            ),
          ),
          Positioned(
            top: 10,
            right: 0,
            child: OnboardingBob(
              phase: 1.4,
              child: ServiceIdentity(
                name: 'Spotify',
                category: SubscriptionCategory.music,
                size: 44,
              ),
            ),
          ),
          Positioned(
            bottom: 14,
            left: 0,
            child: OnboardingBob(
              phase: 2.6,
              child: ServiceIdentity(
                name: 'iCloud',
                category: SubscriptionCategory.cloud,
                size: 42,
              ),
            ),
          ),
          Positioned(
            bottom: 0,
            right: 16,
            child: OnboardingBob(
              phase: 4.0,
              child: ServiceIdentity(
                name: 'Disney+',
                category: SubscriptionCategory.streaming,
                size: 40,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
