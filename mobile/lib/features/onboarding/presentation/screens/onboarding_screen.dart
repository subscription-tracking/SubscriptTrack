import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:provider/provider.dart';
import '../../../settings/presentation/settings_controller.dart';
import '../../../../shared/widgets/ambient_background.dart' show AmbientBlob;
import '../widgets/currency_page.dart';
import '../widgets/illustrations/analytics_illustration.dart';
import '../widgets/illustrations/calendar_illustration.dart';
import '../widgets/illustrations/subscriptions_illustration.dart';
import '../widgets/onboarding_info_page.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({required this.onDone, super.key});

  final VoidCallback onDone;

  static Future<bool> shouldShow() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('onboarding_done') != true;
  }

  static Future<void> markDone() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_done', true);
  }

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;
  String _selectedCurrency = '₺';

  static const _slides = [
    OnboardingSlideData(
      title: 'Aboneliklerini takip et',
      body:
          'Netflix, Spotify, iCloud... Tüm aboneliklerini tek bir yerde topla ve ne kadar harcadığını gör.',
      accentColor: Color(0xFF7377F5),
      bgColor: Color(0xFF0C0E2A),
      illustration: SubscriptionsIllustration(),
    ),
    OnboardingSlideData(
      title: 'Yenilemeleri kaçırma',
      body:
          'Hangi aboneliğin ne zaman yenileneceğini takvimde gör, sürpriz ödemelerle karşılaşma.',
      accentColor: Color(0xFF16A36A),
      bgColor: Color(0xFF071510),
      illustration: CalendarIllustration(),
    ),
    OnboardingSlideData(
      title: 'Harcamalarını analiz et',
      body:
          'Kategoriye göre ne kadar harcadığını gör, gereksiz abonelikleri tespit et ve tasarruf et.',
      accentColor: Color(0xFFF5A524),
      bgColor: Color(0xFF1A1100),
      illustration: AnalyticsIllustration(),
    ),
  ];

  static const _pageCount = 4; // 3 info + 1 currency

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await context.read<SettingsController>().setCurrency(_selectedCurrency);
    await OnboardingScreen.markDone();
    widget.onDone();
  }

  Color get _currentAccent => _page < _slides.length
      ? _slides[_page].accentColor
      : const Color(0xFF7377F5);

  Color get _currentBg =>
      _page < _slides.length ? _slides[_page].bgColor : const Color(0xFF0C0E2A);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      body: Stack(
        children: [
          // Animated gradient wash + soft depth blobs
          AnimatedContainer(
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeInOut,
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(0, -0.6),
                radius: 1.1,
                colors: [_currentBg, cs.surface],
              ),
            ),
          ),
          Positioned.fill(
            // RepaintBoundary: the blur below is expensive to rasterize,
            // and without this it gets re-composited every frame just
            // because a sibling (the floating icons / pulsing badge) is
            // animating.
            child: RepaintBoundary(
              child: IgnorePointer(
                child: Stack(
                  children: [
                    Positioned(
                      top: -120,
                      right: -90,
                      child: AmbientBlob(
                          color: _currentAccent, size: 220, opacity: 0.16),
                    ),
                    Positioned(
                      bottom: 100,
                      left: -100,
                      child: AmbientBlob(
                          color: _currentAccent, size: 180, opacity: 0.1),
                    ),
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                _topBar(cs),
                Expanded(child: _pages()),
                _progressDots(cs),
                const SizedBox(height: 32),
                _primaryButton(),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _topBar(ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 8, 0),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: _currentAccent,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            'SubscriptTrack',
            style: TextStyle(
              color: cs.onSurface.withValues(alpha: 0.55),
              fontWeight: FontWeight.w700,
              fontSize: 14,
              letterSpacing: -0.2,
            ),
          ),
          const Spacer(),
          TextButton(
            onPressed: _finish,
            style: TextButton.styleFrom(
              foregroundColor: _currentAccent.withValues(alpha: 0.72),
            ),
            child: const Text('Atla'),
          ),
        ],
      ),
    );
  }

  Widget _pages() {
    return PageView.builder(
      controller: _controller,
      onPageChanged: (i) => setState(() => _page = i),
      itemCount: _pageCount,
      itemBuilder: (_, i) => i < _slides.length
          ? OnboardingInfoPage(key: ValueKey('slide-$i'), data: _slides[i])
          : CurrencyPage(
              key: const ValueKey('currency'),
              selected: _selectedCurrency,
              onSelect: (c) => setState(() => _selectedCurrency = c),
            ),
    );
  }

  Widget _progressDots(ColorScheme cs) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(
        _pageCount,
        (i) => AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
          margin: const EdgeInsets.symmetric(horizontal: 3),
          width: _page == i ? 24 : 6,
          height: 6,
          decoration: BoxDecoration(
            color: _page == i
                ? _currentAccent
                : cs.onSurface.withValues(alpha: 0.18),
            borderRadius: BorderRadius.circular(3),
          ),
        ),
      ),
    );
  }

  Widget _primaryButton() {
    final isLast = _page == _pageCount - 1;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: _currentAccent.withValues(alpha: 0.35),
              blurRadius: 24,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: FilledButton(
          onPressed: isLast
              ? _finish
              : () => _controller.nextPage(
                    duration: const Duration(milliseconds: 400),
                    curve: Curves.easeInOut,
                  ),
          style: FilledButton.styleFrom(
            minimumSize: const Size.fromHeight(52),
            backgroundColor: _currentAccent,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: Text(isLast ? 'Başla' : 'İleri'),
        ),
      ),
    );
  }
}

/// A slow, continuous up/down bob — used to make floating badges feel alive.

// ─── Slide 1 illustration: orbiting real brand logos around a wallet ───────
