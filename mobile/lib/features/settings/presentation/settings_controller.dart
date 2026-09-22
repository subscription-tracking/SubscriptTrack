import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/config/app_environment.dart';
import '../data/payment_methods_api.dart';

class SettingsController extends ChangeNotifier {
  SettingsController._();
  static final SettingsController instance = SettingsController._();

  static const _keyCurrency = 'settings_currency';
  static const _keyTheme = 'settings_theme';
  static const _keyNotifications = 'settings_notifications';
  static const _keyDaysBefore = 'settings_days_before';
  static const _keyReminderHour = 'settings_reminder_hour';
  static const _keyTimezone = 'settings_timezone';
  static const _keyPaymentMethods = 'settings_payment_methods';

  String _currency = 'TRY';
  ThemeMode _themeMode = ThemeMode.dark;
  bool _notificationsEnabled = true;
  int _daysBefore = 3;
  int _reminderHour = 9;
  String _timezone = '';
  List<String> _paymentMethods = ['Kredi Kartı', 'Banka Kartı', 'Papara'];
  String? _paymentMethodsSyncError;

  /// ISO 4217 code used as the default in the subscription form.
  String get currency => _currency;
  ThemeMode get themeMode => _themeMode;
  bool get notificationsEnabled => _notificationsEnabled;
  int get daysBefore => _daysBefore;

  /// Hatırlatma bildirimlerinin planlandığı saat (0-23, yerel saat). Test 31:
  /// varsayılan 09:00 yerine kullanıcı özelleştirebiliyor.
  int get reminderHour => _reminderHour;

  /// Boş string = cihaz yerel saat dilimi kullan.
  String get timezone => _timezone;
  List<String> get paymentMethods => List.unmodifiable(_paymentMethods);
  String? get paymentMethodsSyncError => _paymentMethodsSyncError;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    _currency = _normalizeCurrency(prefs.getString(_keyCurrency) ?? 'TRY');
    final storedThemeIndex = prefs.getInt(_keyTheme);
    _themeMode = storedThemeIndex != null &&
            storedThemeIndex >= 0 &&
            storedThemeIndex < ThemeMode.values.length
        ? ThemeMode.values[storedThemeIndex]
        : ThemeMode.dark;
    _notificationsEnabled = prefs.getBool(_keyNotifications) ?? true;
    _daysBefore = prefs.getInt(_keyDaysBefore) ?? 3;
    final storedHour = prefs.getInt(_keyReminderHour) ?? 9;
    _reminderHour = storedHour >= 0 && storedHour <= 23 ? storedHour : 9;
    _timezone = prefs.getString(_keyTimezone) ?? '';
    _paymentMethods = prefs.getStringList(_keyPaymentMethods) ??
        ['Kredi Kartı', 'Banka Kartı', 'Papara'];
    await _loadRemotePaymentMethods();
    notifyListeners();
  }

  Future<void> setCurrency(String value) async {
    _currency = _normalizeCurrency(value);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyCurrency, value);
    notifyListeners();
  }

  static String _normalizeCurrency(String value) => switch (value) {
        '₺' || 'TRY' => 'TRY',
        r'$' || 'USD' => 'USD',
        '€' || 'EUR' => 'EUR',
        '£' || 'GBP' => 'GBP',
        _ => 'TRY',
      };

  Future<void> setThemeMode(ThemeMode mode) async {
    _themeMode = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_keyTheme, mode.index);
    notifyListeners();
  }

  Future<void> setNotifications(bool value) async {
    _notificationsEnabled = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyNotifications, value);
    notifyListeners();
  }

  Future<void> setDaysBefore(int value) async {
    _daysBefore = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_keyDaysBefore, value);
    notifyListeners();
  }

  Future<void> setReminderHour(int hour) async {
    if (hour < 0 || hour > 23) return;
    _reminderHour = hour;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_keyReminderHour, hour);
    notifyListeners();
  }

  Future<void> setTimezone(String value) async {
    _timezone = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyTimezone, value);
    notifyListeners();
  }

  Future<void> addPaymentMethod(String name) async {
    final trimmed = name.trim();
    if (trimmed.isEmpty || _paymentMethods.contains(trimmed)) return;
    _paymentMethods = [..._paymentMethods, trimmed];
    final prefs = await SharedPreferences.getInstance();
    await _savePaymentMethods(prefs);
  }

  Future<void> removePaymentMethod(String name) async {
    _paymentMethods = _paymentMethods.where((e) => e != name).toList();
    final prefs = await SharedPreferences.getInstance();
    await _savePaymentMethods(prefs);
  }

  Future<void> renamePaymentMethod(String oldName, String newName) async {
    final trimmed = newName.trim();
    if (trimmed.isEmpty || !_paymentMethods.contains(oldName)) return;
    _paymentMethods =
        _paymentMethods.map((e) => e == oldName ? trimmed : e).toList();
    final prefs = await SharedPreferences.getInstance();
    await _savePaymentMethods(prefs);
  }

  SupabaseClient? get _client =>
      EnvironmentConfig.isSupabaseConfigured ? Supabase.instance.client : null;

  Future<void> _loadRemotePaymentMethods() async {
    final client = _client;
    if (client == null || client.auth.currentUser == null) return;
    try {
      final remote = await PaymentMethodsApi(client: client).load();
      if (remote.isNotEmpty) _paymentMethods = remote;
      _paymentMethodsSyncError = null;
    } on PaymentMethodsApiException catch (e) {
      _paymentMethodsSyncError = e.message;
    }
  }

  Future<void> _savePaymentMethods(SharedPreferences prefs) async {
    await prefs.setStringList(_keyPaymentMethods, _paymentMethods);
    await _syncRemotePaymentMethods();
    notifyListeners();
  }

  Future<void> retryPaymentMethodsSync() async {
    await _syncRemotePaymentMethods();
    notifyListeners();
  }

  Future<void> _syncRemotePaymentMethods() async {
    final client = _client;
    if (client == null || client.auth.currentUser == null) return;
    try {
      await PaymentMethodsApi(client: client).replace(_paymentMethods);
      _paymentMethodsSyncError = null;
    } on PaymentMethodsApiException catch (e) {
      _paymentMethodsSyncError = e.message;
    }
  }

  /// Hesap silme sunucuda başarılı olduktan sonra, kullanıcıya özel yerel
  /// ödeme yöntemi etiketlerini yeni bir kullanıcıya göstermemek için siler.
  Future<void> clearAccountPaymentMethods() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyPaymentMethods);
    _paymentMethods = ['Kredi Kartı', 'Banka Kartı', 'Papara'];
    _paymentMethodsSyncError = null;
    notifyListeners();
  }
}
