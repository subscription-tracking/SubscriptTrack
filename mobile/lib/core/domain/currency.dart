/// Desteklenen para birimlerini temsil eden ve 6 ayrı dosyada kopyalanmış
/// sembol/isim/kod eşlemelerini tek bir merkezde toplayan domain modeli.
enum AppCurrency {
  try_('TRY', '₺', 'Türk Lirası'),
  usd('USD', '\$', 'Amerikan Doları'),
  eur('EUR', '€', 'Euro'),
  gbp('GBP', '£', 'İngiliz Sterlini');

  const AppCurrency(this.code, this.symbol, this.fullName);

  final String code;
  final String symbol;
  final String fullName;

  static const List<AppCurrency> supported = [
    AppCurrency.try_,
    AppCurrency.usd,
    AppCurrency.eur,
    AppCurrency.gbp,
  ];

  /// Verilen ISO koduna veya sembole karşılık gelen sembolü döner (varsayılan '₺').
  static String symbolOf(String? codeOrSymbol) {
    if (codeOrSymbol == null || codeOrSymbol.isEmpty) return '₺';
    final normalized = normalize(codeOrSymbol);
    return switch (normalized) {
      'USD' => '\$',
      'EUR' => '€',
      'GBP' => '£',
      _ => '₺',
    };
  }

  /// Verilen ISO koduna karşılık gelen Türkçe adı döner.
  static String nameOf(String? code) {
    final normalized = normalize(code ?? 'TRY');
    return switch (normalized) {
      'USD' => 'Amerikan Doları',
      'EUR' => 'Euro',
      'GBP' => 'İngiliz Sterlini',
      _ => 'Türk Lirası',
    };
  }

  /// Hem sembol ('₺', '$') hem kod ('TRY', 'USD') girişlerini standart ISO koduna çevirir.
  static String normalize(String input) {
    final trimmed = input.trim().toUpperCase();
    return switch (trimmed) {
      '₺' || 'TL' || 'TRY' => 'TRY',
      '\$' || 'USD' => 'USD',
      '€' || 'EUR' => 'EUR',
      '£' || 'GBP' => 'GBP',
      _ => trimmed.isEmpty ? 'TRY' : trimmed,
    };
  }

  /// Form dropdown veya ayarlar listesi için (kod, sembol) tuple listesi.
  static List<(String code, String symbol)> get options =>
      supported.map((c) => (c.code, c.symbol)).toList();

  /// (sembol, ad, kod) tuple listesi (Onboarding için).
  static List<(String symbol, String name, String code)>
      get onboardingOptions =>
          supported.map((c) => (c.symbol, c.fullName, c.code)).toList();
}
