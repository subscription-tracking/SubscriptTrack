import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../settings/presentation/settings_controller.dart';
import '../../../subscriptions/domain/subscription_models.dart';
import '../../../../shared/widgets/service_identity.dart';

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
    _SlideData(
      title: 'Aboneliklerini takip et',
      body:
          'Netflix, Spotify, iCloud... Tüm aboneliklerini tek bir yerde topla ve ne kadar harcadığını gör.',
      accentColor: Color(0xFF7377F5),
      bgColor: Color(0xFF0C0E2A),
      illustration: _SubscriptionsIllustration(),
    ),
    _SlideData(
      title: 'Yenilemeleri kaçırma',
      body:
          'Hangi aboneliğin ne zaman yenileneceğini takvimde gör, sürpriz ödemelerle karşılaşma.',
      accentColor: Color(0xFF16A36A),
      bgColor: Color(0xFF071510),
      illustration: _CalendarIllustration(),
    ),
    _SlideData(
      title: 'Harcamalarını analiz et',
      body:
          'Kategoriye göre ne kadar harcadığını gör, gereksiz abonelikleri tespit et ve tasarruf et.',
      accentColor: Color(0xFFF5A524),
      bgColor: Color(0xFF1A1100),
      illustration: _AnalyticsIllustration(),
    ),
  ];

  static const _pageCount = 4; // 3 info + 1 currency

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await SettingsController.instance.setCurrency(_selectedCurrency);
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
    final isLast = _page == _pageCount - 1;

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
            child: IgnorePointer(
              child: AnimatedOpacity(
                duration: const Duration(milliseconds: 500),
                opacity: 1,
                child: Stack(
                  children: [
                    Positioned(
                      top: -60,
                      right: -50,
                      child: _blob(_currentAccent, 220, 0.18),
                    ),
                    Positioned(
                      bottom: 120,
                      left: -70,
                      child: _blob(_currentAccent, 180, 0.12),
                    ),
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                Padding(
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
                          foregroundColor:
                              _currentAccent.withValues(alpha: 0.72),
                        ),
                        child: const Text('Atla'),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: PageView.builder(
                    controller: _controller,
                    onPageChanged: (i) => setState(() => _page = i),
                    itemCount: _pageCount,
                    itemBuilder: (_, i) => i < _slides.length
                        ? _InfoPage(key: ValueKey('slide-$i'), data: _slides[i])
                        : _CurrencyPage(
                            key: const ValueKey('currency'),
                            selected: _selectedCurrency,
                            onSelect: (c) =>
                                setState(() => _selectedCurrency = c),
                          ),
                  ),
                ),
                // Progress dots
                Row(
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
                ),
                const SizedBox(height: 32),
                Padding(
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
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _blob(Color color, double size, double opacity) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [color.withValues(alpha: opacity), Colors.transparent],
          ),
        ),
      );
}

class _SlideData {
  const _SlideData({
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

/// Fades + slides its child up on first build — gives each swiped-in page
/// a gentle entrance instead of appearing statically.
class _EntranceFade extends StatefulWidget {
  const _EntranceFade({required this.child, this.delay = Duration.zero});
  final Widget child;
  final Duration delay;

  @override
  State<_EntranceFade> createState() => _EntranceFadeState();
}

class _EntranceFadeState extends State<_EntranceFade>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _fade;
  late final Animation<Offset> _slide;
  Timer? _startTimer;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 550));
    _fade = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _slide = Tween(begin: const Offset(0, 0.06), end: Offset.zero)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic));
    _startTimer = Timer(widget.delay, () {
      if (mounted) _ctrl.forward();
    });
  }

  @override
  void dispose() {
    _startTimer?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(position: _slide, child: widget.child),
    );
  }
}

/// A slow, continuous up/down bob — used to make floating badges feel alive.
class _Bob extends StatefulWidget {
  const _Bob({required this.child, this.phase = 0});
  final Widget child;
  final double phase;
  static const _amplitude = 6.0;

  @override
  State<_Bob> createState() => _BobState();
}

class _BobState extends State<_Bob> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2600),
    )..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (context, child) {
        final t = _ctrl.value * 2 * math.pi + widget.phase;
        return Transform.translate(
          offset: Offset(0, math.sin(t) * _Bob._amplitude),
          child: child,
        );
      },
      child: widget.child,
    );
  }
}

class _InfoPage extends StatelessWidget {
  const _InfoPage({required this.data, super.key});
  final _SlideData data;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _EntranceFade(child: data.illustration),
          const SizedBox(height: 44),
          _EntranceFade(
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
          _EntranceFade(
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

// ─── Slide 1 illustration: orbiting real brand logos around a wallet ───────

class _SubscriptionsIllustration extends StatelessWidget {
  const _SubscriptionsIllustration();

  @override
  Widget build(BuildContext context) {
    const accent = Color(0xFF7377F5);
    return const SizedBox(
      width: 220,
      height: 220,
      child: Stack(
        alignment: Alignment.center,
        children: [
          _GlowOrb(
            color: accent,
            icon: Icons.account_balance_wallet_rounded,
          ),
          Positioned(
            top: 4,
            left: 10,
            child: _Bob(
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
            child: _Bob(
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
            child: _Bob(
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
            child: _Bob(
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

class _GlowOrb extends StatelessWidget {
  const _GlowOrb({required this.color, required this.icon});
  final Color color;
  final IconData icon;
  static const _size = 118.0;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: _size,
      height: _size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: 0.1),
        border: Border.all(color: color.withValues(alpha: 0.28), width: 1),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.28),
            blurRadius: 56,
            spreadRadius: 6,
          ),
        ],
      ),
      child: Icon(icon, size: _size * 0.46, color: color),
    );
  }
}

// ─── Slide 2 illustration: a mini calendar mockup with a pulsing due date ──

class _CalendarIllustration extends StatefulWidget {
  const _CalendarIllustration();

  @override
  State<_CalendarIllustration> createState() => _CalendarIllustrationState();
}

class _CalendarIllustrationState extends State<_CalendarIllustration>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const accent = Color(0xFF16A36A);
    final cs = Theme.of(context).colorScheme;

    return SizedBox(
      width: 220,
      height: 200,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: 190,
            height: 178,
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: accent.withValues(alpha: 0.22)),
              boxShadow: [
                BoxShadow(
                  color: accent.withValues(alpha: 0.22),
                  blurRadius: 48,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 40,
                      height: 8,
                      decoration: BoxDecoration(
                        color: cs.onSurface.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    Icon(Icons.chevron_right_rounded,
                        size: 16, color: cs.onSurface.withValues(alpha: 0.3)),
                  ],
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: GridView.count(
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 7,
                    mainAxisSpacing: 5,
                    crossAxisSpacing: 5,
                    children: List.generate(21, (i) {
                      final isDue = i == 16;
                      return Container(
                        decoration: BoxDecoration(
                          color: isDue
                              ? accent
                              : cs.onSurface.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(5),
                        ),
                      );
                    }),
                  ),
                ),
              ],
            ),
          ),
          // Pulsing "renewal due" badge anchored over the highlighted cell.
          Positioned(
            right: 22,
            bottom: 34,
            child: AnimatedBuilder(
              animation: _pulse,
              builder: (context, child) {
                final scale = 1 + _pulse.value * 0.18;
                return Transform.scale(scale: scale, child: child);
              },
              child: Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: accent,
                  shape: BoxShape.circle,
                  border: Border.all(color: cs.surface, width: 3),
                  boxShadow: [
                    BoxShadow(
                      color: accent.withValues(alpha: 0.5),
                      blurRadius: 16,
                    ),
                  ],
                ),
                child: const Icon(Icons.notifications_rounded,
                    size: 15, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Slide 3 illustration: an animated spend-breakdown ring ────────────────

class _AnalyticsIllustration extends StatefulWidget {
  const _AnalyticsIllustration();

  @override
  State<_AnalyticsIllustration> createState() =>
      _AnalyticsIllustrationState();
}

class _AnalyticsIllustrationState extends State<_AnalyticsIllustration>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _sweep;
  Timer? _startTimer;

  static const _segments = [
    (0.42, Color(0xFFF5A524)),
    (0.30, Color(0xFF7377F5)),
    (0.28, Color(0xFF16A36A)),
  ];

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1100));
    _sweep = CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic);
    _startTimer = Timer(const Duration(milliseconds: 150), () {
      if (mounted) _ctrl.forward();
    });
  }

  @override
  void dispose() {
    _startTimer?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const accent = Color(0xFFF5A524);
    return SizedBox(
      width: 220,
      height: 220,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: 118,
            height: 118,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: accent.withValues(alpha: 0.24),
                  blurRadius: 56,
                  spreadRadius: 6,
                ),
              ],
            ),
          ),
          AnimatedBuilder(
            animation: _sweep,
            builder: (context, _) => CustomPaint(
              size: const Size(190, 190),
              painter: _RingPainter(progress: _sweep.value, segments: _segments),
            ),
          ),
          FadeTransition(
            opacity: _sweep,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.trending_down_rounded, color: accent, size: 26),
                const SizedBox(height: 4),
                Text(
                  '%18',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                ),
                Text(
                  'tasarruf',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter({required this.progress, required this.segments});
  final double progress;
  final List<(double, Color)> segments;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 10;
    final strokeWidth = size.width * 0.09;
    var start = -math.pi / 2;
    for (final (fraction, color) in segments) {
      final sweep = fraction * 2 * math.pi * progress;
      final paint = Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        start,
        sweep,
        false,
        paint,
      );
      start += fraction * 2 * math.pi;
    }
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) =>
      oldDelegate.progress != progress;
}

// ─── Currency page ──────────────────────────────────────────────────────────

class _CurrencyPage extends StatelessWidget {
  const _CurrencyPage({required this.selected, required this.onSelect, super.key});

  final String selected;
  final ValueChanged<String> onSelect;

  static const _options = [
    ('₺', 'Türk Lirası', 'TRY'),
    ('\$', 'ABD Doları', 'USD'),
    ('€', 'Euro', 'EUR'),
    ('£', 'İngiliz Sterlini', 'GBP'),
  ];

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _EntranceFade(
            child: SizedBox(
              width: 190,
              height: 150,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  _GlowOrb(
                    color: cs.primary,
                    icon: Icons.currency_exchange_rounded,
                  ),
                  Positioned(
                    top: 2,
                    left: 6,
                    child: _Bob(phase: 0.6, child: _currencyChip(cs, '\$')),
                  ),
                  Positioned(
                    top: 6,
                    right: 0,
                    child: _Bob(phase: 2.2, child: _currencyChip(cs, '€')),
                  ),
                  Positioned(
                    bottom: 0,
                    left: 20,
                    child: _Bob(phase: 3.6, child: _currencyChip(cs, '£')),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),
          _EntranceFade(
            delay: const Duration(milliseconds: 80),
            child: Text(
              'Para birimi seç',
              style: Theme.of(context)
                  .textTheme
                  .headlineSmall
                  ?.copyWith(fontWeight: FontWeight.w800),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 8),
          _EntranceFade(
            delay: const Duration(milliseconds: 120),
            child: Text(
              'Daha sonra ayarlardan değiştirebilirsin.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 28),
          _EntranceFade(
            delay: const Duration(milliseconds: 160),
            child: Column(
              children: _options.map((opt) {
                final isSelected = selected == opt.$1;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => onSelect(opt.$1),
                      borderRadius: BorderRadius.circular(16),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? cs.primary.withValues(alpha: 0.1)
                              : cs.surfaceContainerHigh,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isSelected
                                ? cs.primary.withValues(alpha: 0.5)
                                : cs.outlineVariant,
                            width: isSelected ? 1.5 : 0.5,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? cs.primary.withValues(alpha: 0.14)
                                    : cs.surfaceContainerHighest,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Center(
                                child: Text(
                                  opt.$1,
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                    color: isSelected
                                        ? cs.primary
                                        : cs.onSurfaceVariant,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    opt.$2,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(
                                          fontWeight: FontWeight.w600,
                                          color: isSelected
                                              ? cs.onSurface
                                              : cs.onSurfaceVariant,
                                        ),
                                  ),
                                  Text(
                                    opt.$3,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodySmall
                                        ?.copyWith(fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                            if (isSelected)
                              Icon(Icons.check_circle_rounded,
                                  color: cs.primary, size: 20),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _currencyChip(ColorScheme cs, String symbol) => Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: cs.surfaceContainerHigh,
          shape: BoxShape.circle,
          border: Border.all(color: cs.outlineVariant),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.12),
              blurRadius: 8,
            ),
          ],
        ),
        child: Center(
          child: Text(
            symbol,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 14,
              color: cs.onSurface,
            ),
          ),
        ),
      );
}
