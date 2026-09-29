/// Uygulama içi yol (path) sabitleri.
///
/// Feature'lar birbirinin ekranını import etmek yerine bu yolları kullanır;
/// yol → ekran eşlemesi yalnızca `app/router` altında yapılır. Bu dosya hiçbir
/// ekran ya da feature'a bağımlı değildir.
abstract final class AppRoutes {
  static const splash = '/splash';
  static const onboarding = '/onboarding';
  static const login = '/login';
  static const register = '/register';
  static const forgotPassword = '/forgot-password';
  static const resetPassword = '/reset-password';
  static const home = '/home';

  // Yasal sayfalar (oturum açmadan da erişilir)
  static const privacyPolicy = '/legal/privacy';
  static const termsOfService = '/legal/terms';

  // Abonelikler
  static const addSubscription = '/subscriptions/add';
  static const archivedSubscriptions = '/subscriptions/archived';
  static const csvImport = '/subscriptions/import';

  /// Belirli bir tarihte başlayan yeni abonelik ekleme.
  static String addSubscriptionOn(DateTime startDate) =>
      '$addSubscription?start=${Uri.encodeQueryComponent(startDate.toIso8601String())}';

  static String subscription(String id) =>
      '/subscriptions/${Uri.encodeComponent(id)}';
  static String editSubscription(String id) => '${subscription(id)}/edit';

  // Diğer özellikler
  static const calendar = '/calendar';
  static const notifications = '/notifications';
  static const stats = '/stats';
  static const paymentHistory = '/stats/payments';
  static const savings = '/savings';

  // Ayarlar
  static const profile = '/settings/profile';
  static const notificationSettings = '/settings/notifications';
  static const paymentMethods = '/settings/payment-methods';
  static const appearance = '/settings/appearance';
  static const appLock = '/settings/app-lock';
  static const privacyCenter = '/settings/privacy';
  static const feedback = '/settings/feedback';
  static const exportData = '/settings/export';
  static const deleteAccount = '/settings/delete-account';

  /// Oturum açmadan erişilebilen yollar.
  static const publicPaths = {
    login,
    register,
    forgotPassword,
    privacyPolicy,
    termsOfService,
  };
}
