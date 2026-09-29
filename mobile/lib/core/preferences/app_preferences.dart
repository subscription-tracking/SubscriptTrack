/// Ayarlardan feature'ların ihtiyaç duyduğu kullanıcı tercihleri. Feature'lar
/// `SettingsController`'a değil bu arayüze bağımlıdır; böylece
/// abonelik/kimlik doğrulama ile ayarlar arasında döngüsel bağımlılık oluşmaz.
abstract interface class AppPreferences {
  /// Abonelik formunda varsayılan olarak seçilen ISO 4217 para birimi.
  String get currency;

  /// Kullanıcının kayıtlı ödeme yöntemi etiketleri.
  List<String> get paymentMethods;

  Future<void> addPaymentMethod(String name);

  /// Hesap silindikten sonra kullanıcıya özel yerel tercihleri temizler.
  Future<void> clearAccountPaymentMethods();
}

/// Varsayılan ödeme yöntemi etiketleri.
const defaultPaymentMethods = ['Kredi Kartı', 'Banka Kartı', 'Papara'];

/// Kalıcılığı olmayan bellek içi uygulama; yalnızca ayarlar sağlanmadığında
/// (izole widget testleri) varsayılan olarak kullanılır.
class InMemoryAppPreferences implements AppPreferences {
  InMemoryAppPreferences({this.currency = 'TRY'})
      : _paymentMethods = [...defaultPaymentMethods];

  @override
  final String currency;
  List<String> _paymentMethods;

  @override
  List<String> get paymentMethods => List.unmodifiable(_paymentMethods);

  @override
  Future<void> addPaymentMethod(String name) async {
    final trimmed = name.trim();
    if (trimmed.isEmpty || _paymentMethods.contains(trimmed)) return;
    _paymentMethods = [..._paymentMethods, trimmed];
  }

  @override
  Future<void> clearAccountPaymentMethods() async {
    _paymentMethods = [...defaultPaymentMethods];
  }
}
