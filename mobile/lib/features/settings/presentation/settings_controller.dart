import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/domain/currency.dart';
import '../../../core/preferences/app_preferences.dart';
import '../data/payment_methods_api.dart';

class SettingsController extends ChangeNotifier implements AppPreferences {
  SettingsController();

  static const _keyCurrency = 'settings_currency';
  static const _keyNotifications = 'settings_notifications';
  static const _keyDaysBefore = 'settings_days_before';
  static const _keyReminderHour = 'settings_reminder_hour';
  static const _keyTimezone = 'settings_timezone';
  static const _keyPaymentMethods = 'settings_payment_methods';

  String _currency = 'TRY';
  bool _notificationsEnabled = true;
  int _daysBefore = 3;
  int _reminderHour = 9;
  String _timezone = '';
  List<String> _paymentMethods = [...defaultPaymentMethods];
  String? _paymentMethodsSyncError;

  /// ISO 4217 code used as the default in the subscription form.
  @override
  String get currency => _currency;
  bool get notificationsEnabled => _notificationsEnabled;
  int get daysBefore => _daysBefore;

  /// Hatırlatma bildirimlerinin planlandığı saat (0-23, yerel saat). Test 31:
  /// varsayılan 09:00 yerine kullanıcı özelleştirebiliyor.
  int get reminderHour => _reminderHour;

  /// Boş string = cihaz yerel saat dilimi kullan.
  String get timezone => _timezone;
  @override
  List<String> get paymentMethods => List.unmodifiable(_paymentMethods);
  String? get paymentMethodsSyncError => _paymentMethodsSyncError;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    _currency = _normalizeCurrency(prefs.getString(_keyCurrency) ?? 'TRY');
    // Remove the legacy theme preference so old light/system selections do
    // not linger after the app moved to its dark-only design.
    await prefs.remove('settings_theme');
    _notificationsEnabled = prefs.getBool(_keyNotifications) ?? true;
    _daysBefore = prefs.getInt(_keyDaysBefore) ?? 3;
    final storedHour = prefs.getInt(_keyReminderHour) ?? 9;
    _reminderHour = storedHour >= 0 && storedHour <= 23 ? storedHour : 9;
    _timezone = prefs.getString(_keyTimezone) ?? '';
    _paymentMethods =
        prefs.getStringList(_keyPaymentMethods) ?? [...defaultPaymentMethods];
    await _loadRemotePaymentMethods();
    notifyListeners();
  }

  Future<void> setCurrency(String value) async {
    _currency = _normalizeCurrency(value);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyCurrency, value);
    notifyListeners();
  }

  /// Sembol/kod girdisini desteklenen ISO koduna çevirir; bilinmeyen para
  /// birimleri varsayılan TRY'ye düşer.
  static String _normalizeCurrency(String value) {
    final code = AppCurrency.normalize(value);
    return AppCurrency.supported.any((c) => c.code == code) ? code : 'TRY';
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

  @override
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

  Future<void> _loadRemotePaymentMethods() async {
    if (!PaymentMethodsApi.isAvailable) return;
    try {
      final remote = await PaymentMethodsApi().load();
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
    if (!PaymentMethodsApi.isAvailable) return;
    try {
      await PaymentMethodsApi().replace(_paymentMethods);
      _paymentMethodsSyncError = null;
    } on PaymentMethodsApiException catch (e) {
      _paymentMethodsSyncError = e.message;
    }
  }

  /// Hesap silme sunucuda başarılı olduktan sonra, kullanıcıya özel yerel
  /// ödeme yöntemi etiketlerini yeni bir kullanıcıya göstermemek için siler.
  @override
  Future<void> clearAccountPaymentMethods() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyPaymentMethods);
    _paymentMethods = [...defaultPaymentMethods];
    _paymentMethodsSyncError = null;
    notifyListeners();
  }
}
