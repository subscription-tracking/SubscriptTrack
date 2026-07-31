import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsController extends ChangeNotifier {
  SettingsController._();
  static final SettingsController instance = SettingsController._();

  static const _keyCurrency = 'settings_currency';
  static const _keyTheme = 'settings_theme';
  static const _keyNotifications = 'settings_notifications';
  static const _keyDaysBefore = 'settings_days_before';
  static const _keyTimezone = 'settings_timezone';

  String _currency = '₺';
  ThemeMode _themeMode = ThemeMode.system;
  bool _notificationsEnabled = true;
  int _daysBefore = 3;
  String _timezone = '';

  String get currency => _currency;
  ThemeMode get themeMode => _themeMode;
  bool get notificationsEnabled => _notificationsEnabled;
  int get daysBefore => _daysBefore;
  /// Boş string = cihaz yerel saat dilimi kullan.
  String get timezone => _timezone;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    _currency = prefs.getString(_keyCurrency) ?? '₺';
    _themeMode = ThemeMode.values[prefs.getInt(_keyTheme) ?? 0];
    _notificationsEnabled = prefs.getBool(_keyNotifications) ?? true;
    _daysBefore = prefs.getInt(_keyDaysBefore) ?? 3;
    _timezone = prefs.getString(_keyTimezone) ?? '';
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
}
