import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/config/app_environment.dart';

class SettingsController extends ChangeNotifier {
  SettingsController._();
  static final SettingsController instance = SettingsController._();

  static const _keyCurrency = 'settings_currency';
  static const _keyTheme = 'settings_theme';
  static const _keyNotifications = 'settings_notifications';
  static const _keyDaysBefore = 'settings_days_before';
  static const _keyTimezone = 'settings_timezone';
  static const _keyPaymentMethods = 'settings_payment_methods';

  String _currency = '₺';
  ThemeMode _themeMode = ThemeMode.dark;
  bool _notificationsEnabled = true;
  int _daysBefore = 3;
  String _timezone = '';
  List<String> _paymentMethods = ['Kredi Kartı', 'Banka Kartı', 'Papara'];

  String get currency => _currency;
  ThemeMode get themeMode => _themeMode;
  bool get notificationsEnabled => _notificationsEnabled;
  int get daysBefore => _daysBefore;

  /// Boş string = cihaz yerel saat dilimi kullan.
  String get timezone => _timezone;
  List<String> get paymentMethods => List.unmodifiable(_paymentMethods);

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    _currency = prefs.getString(_keyCurrency) ?? '₺';
    final storedThemeIndex = prefs.getInt(_keyTheme);
    _themeMode = storedThemeIndex != null &&
            storedThemeIndex >= 0 &&
            storedThemeIndex < ThemeMode.values.length
        ? ThemeMode.values[storedThemeIndex]
        : ThemeMode.dark;
    _notificationsEnabled = prefs.getBool(_keyNotifications) ?? true;
    _daysBefore = prefs.getInt(_keyDaysBefore) ?? 3;
    _timezone = prefs.getString(_keyTimezone) ?? '';
    _paymentMethods = prefs.getStringList(_keyPaymentMethods) ??
        ['Kredi Kartı', 'Banka Kartı', 'Papara'];
    await _loadRemotePaymentMethods();
    notifyListeners();
  }

  Future<void> setCurrency(String value) async {
    _currency = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyCurrency, value);
    notifyListeners();
  }

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
    await prefs.setStringList(_keyPaymentMethods, _paymentMethods);
    await _syncRemotePaymentMethods();
    notifyListeners();
  }

  Future<void> removePaymentMethod(String name) async {
    _paymentMethods = _paymentMethods.where((e) => e != name).toList();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_keyPaymentMethods, _paymentMethods);
    await _syncRemotePaymentMethods();
    notifyListeners();
  }

  Future<void> renamePaymentMethod(String oldName, String newName) async {
    final trimmed = newName.trim();
    if (trimmed.isEmpty || !_paymentMethods.contains(oldName)) return;
    _paymentMethods =
        _paymentMethods.map((e) => e == oldName ? trimmed : e).toList();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_keyPaymentMethods, _paymentMethods);
    await _syncRemotePaymentMethods();
    notifyListeners();
  }

  SupabaseClient? get _client =>
      EnvironmentConfig.isSupabaseConfigured ? Supabase.instance.client : null;

  Future<void> _loadRemotePaymentMethods() async {
    final client = _client;
    final userId = client?.auth.currentUser?.id;
    if (client == null || userId == null) return;
    try {
      final rows = await client
          .from('payment_methods')
          .select('name')
          .eq('user_id', userId)
          .order('created_at');
      final remote = rows.map((row) => row['name'] as String).toList();
      if (remote.isNotEmpty) _paymentMethods = remote;
    } catch (_) {}
  }

  Future<void> _syncRemotePaymentMethods() async {
    final client = _client;
    final userId = client?.auth.currentUser?.id;
    if (client == null || userId == null) return;
    try {
      await client.from('payment_methods').delete().eq('user_id', userId);
      await client.from('payment_methods').insert(_paymentMethods
          .map((name) => {'user_id': userId, 'name': name})
          .toList());
    } catch (_) {}
  }
}
