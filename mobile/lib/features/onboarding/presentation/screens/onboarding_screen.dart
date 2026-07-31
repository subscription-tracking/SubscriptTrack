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

  // Info pages (index 0-2) + currency page (index 3)
  static const _infoPages = [
    _PageData(
      icon: Icons.account_balance_wallet_outlined,
      title: 'Aboneliklerini takip et',
      body:
          'Netflix, Spotify, iCloud... Tüm aboneliklerini tek bir yerde topla ve ne kadar harcadığını gör.',
    ),
    _PageData(
      icon: Icons.calendar_month_outlined,
      title: 'Yenilemeleri kaçırma',
      body:
          'Hangi aboneliğin ne zaman yenileneceğini takvimde gör, sürpriz ödemelerle karşılaşma.',
    ),
    _PageData(
      icon: Icons.insights_outlined,
      title: 'Harcamalarını analiz et',
      body:
          'Kategoriye göre ne kadar harcadığını gör, gereksiz abonelikleri tespit et ve tasarruf et.',
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

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final isLast = _page == _pageCount - 1;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.topRight,
              child: TextButton(
                onPressed: _finish,
                child: const Text('Atla'),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                onPageChanged: (i) => setState(() => _page = i),
                itemCount: _pageCount,
                itemBuilder: (_, i) => i < _infoPages.length
                    ? _PageView(data: _infoPages[i])
                    : _CurrencyPage(
                        selected: _selectedCurrency,
                        onSelect: (c) =>
                            setState(() => _selectedCurrency = c),
                      ),
              ),
            ),
            // Dots
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _pageCount,
                (i) => AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _page == i ? 20 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _page == i
                        ? colors.primary
                        : colors.primary.withValues(alpha: .3),
                    borderRadius: BorderRadius.circular(4),
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
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        ),
                style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(52)),
                child: Text(isLast ? 'Başla' : 'İleri'),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _PageData {
  const _PageData(
      {required this.icon, required this.title, required this.body});
  final IconData icon;
  final String title;
  final String body;
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
    final colors = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: colors.primaryContainer,
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.currency_exchange,
                size: 56, color: colors.onPrimaryContainer),
          ),
          const SizedBox(height: 40),
          Text(
            'Para birimi seç',
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Varsayılan para birimini seç. Daha sonra ayarlardan değiştirebilirsin.',
            style: Theme.of(context).textTheme.bodyLarge,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          ...(_options.map((opt) => Card(
                margin: const EdgeInsets.only(bottom: 12),
                color: selected == opt.$1
                    ? colors.primaryContainer
                    : colors.surfaceContainerHighest,
                child: ListTile(
                  onTap: () => onSelect(opt.$1),
                  leading: Text(opt.$1,
                      style: Theme.of(context).textTheme.headlineSmall),
                  title: Text(opt.$2),
                  subtitle: Text(opt.$3),
                  trailing: selected == opt.$1
                      ? Icon(Icons.check_circle, color: colors.primary)
                      : null,
                ),
              ))),
        ],
      ),
    );
  }
}

class _PageView extends StatelessWidget {
  const _PageView({required this.data});
  final _PageData data;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: colors.primaryContainer,
              shape: BoxShape.circle,
            ),
            child: Icon(data.icon, size: 56, color: colors.onPrimaryContainer),
          ),
          const SizedBox(height: 40),
          Text(
            data.title,
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            data.body,
            style: Theme.of(context).textTheme.bodyLarge,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
