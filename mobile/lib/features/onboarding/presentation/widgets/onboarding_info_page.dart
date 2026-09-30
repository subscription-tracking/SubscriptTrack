import 'package:flutter/material.dart';
import '../../../../shared/widgets/ambient_background.dart' show EntranceFade;

class OnboardingSlideData {
  const OnboardingSlideData({
    required this.title,
    required this.body,
    required this.accentColor,
    required this.bgColor,
    required this.illustration,
  });
  final String title;
  final String body;
  final Color accentColor;
  final Color bgColor;
  final Widget illustration;
}

class OnboardingInfoPage extends StatelessWidget {
  const OnboardingInfoPage({required this.data, super.key});
  final OnboardingSlideData data;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          EntranceFade(child: data.illustration),
          const SizedBox(height: 44),
          EntranceFade(
            delay: const Duration(milliseconds: 80),
            child: Text(
              data.title,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    height: 1.2,
                  ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 16),
          EntranceFade(
            delay: const Duration(milliseconds: 140),
            child: Text(
              data.body,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    height: 1.65,
                  ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}
