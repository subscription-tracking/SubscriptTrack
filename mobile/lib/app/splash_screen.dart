import 'package:flutter/material.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return Scaffold(
      backgroundColor: colors.primary,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                color: colors.onPrimary.withValues(alpha: .15),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Icon(
                Icons.account_balance_wallet_outlined,
                size: 52,
                color: colors.onPrimary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'SubscriptTrack',
              style: text.headlineMedium?.copyWith(
                color: colors.onPrimary,
                fontWeight: FontWeight.bold,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Aboneliklerini kontrol altına al',
              style: text.bodyMedium?.copyWith(
                color: colors.onPrimary.withValues(alpha: .75),
              ),
            ),
            const SizedBox(height: 56),
            SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: colors.onPrimary.withValues(alpha: .7),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
