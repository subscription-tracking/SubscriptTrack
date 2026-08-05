import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../settings/presentation/settings_controller.dart';

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
      icon: Icons.account_balance_wallet_rounded,
      title: 'Aboneliklerini takip et',
      body:
          'Netflix, Spotify, iCloud... Tüm aboneliklerini tek bir yerde topla ve ne kadar harcadığını gör.',
      accentColor: Color(0xFF7377F5),
      bgColor: Color(0xFF0C0E2A),
    ),
    _SlideData(
      icon: Icons.calendar_month_rounded,
      title: 'Yenilemeleri kaçırma',
      body:
          'Hangi aboneliğin ne zaman yenileneceğini takvimde gör, sürpriz ödemelerle karşılaşma.',
      accentColor: Color(0xFF16A36A),
      bgColor: Color(0xFF071510),
    ),
    _SlideData(
      icon: Icons.insights_rounded,
      title: 'Harcamalarını analiz et',
      body:
          'Kategoriye göre ne kadar harcadığını gör, gereksiz abonelikleri tespit et ve tasarruf et.',
      accentColor: Color(0xFFF5A524),
      bgColor: Color(0xFF1A1100),
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

  Color get _currentBg => _page < _slides.length
      ? _slides[_page].bgColor
      : const Color(0xFF0C0E2A);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isLast = _page == _pageCount - 1;

    return Scaffold(
      body: Stack(
        children: [
          // Animated gradient wash
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
          SafeArea(
            child: Column(
              children: [
                Align(
                  alignment: Alignment.topRight,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(0, 4, 8, 0),
                    child: TextButton(
                      onPressed: _finish,
                      style: TextButton.styleFrom(
                        foregroundColor:
                            _currentAccent.withValues(alpha: 0.72),
                      ),
                      child: const Text('Atla'),
                    ),
                  ),
                ),
                Expanded(
                  child: PageView.builder(
                    controller: _controller,
                    onPageChanged: (i) => setState(() => _page = i),
                    itemCount: _pageCount,
                    itemBuilder: (_, i) => i < _slides.length
                        ? _InfoPage(data: _slides[i])
                        : _CurrencyPage(
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
                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SlideData {
  const _SlideData({
    required this.icon,
    required this.title,
    required this.body,
    required this.accentColor,
    required this.bgColor,
  });
  final IconData icon;
  final String title;
  final String body;
  final Color accentColor;
  final Color bgColor;
}

class _InfoPage extends StatelessWidget {
  const _InfoPage({required this.data});
  final _SlideData data;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Glowing icon orb
          Container(
            width: 136,
            height: 136,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: data.accentColor.withValues(alpha: 0.1),
              border: Border.all(
                color: data.accentColor.withValues(alpha: 0.28),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: data.accentColor.withValues(alpha: 0.28),
                  blurRadius: 64,
                  spreadRadius: 8,
                ),
              ],
            ),
            child: Icon(data.icon, size: 62, color: data.accentColor),
          ),
          const SizedBox(height: 48),
          Text(
            data.title,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                  height: 1.2,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            data.body,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  height: 1.65,
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _CurrencyPage extends StatelessWidget {
  const _CurrencyPage({required this.selected, required this.onSelect});

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
          Container(
            width: 136,
            height: 136,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: cs.primary.withValues(alpha: 0.1),
              border: Border.all(
                color: cs.primary.withValues(alpha: 0.28),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: cs.primary.withValues(alpha: 0.28),
                  blurRadius: 64,
                  spreadRadius: 8,
                ),
              ],
            ),
            child: Icon(Icons.currency_exchange_rounded,
                size: 62, color: cs.primary),
          ),
          const SizedBox(height: 40),
          Text(
            'Para birimi seç',
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.w800),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Daha sonra ayarlardan değiştirebilirsin.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 28),
          ...(_options.map((opt) {
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
          })),
        ],
      ),
    );
  }
}
