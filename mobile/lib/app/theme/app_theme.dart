import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

abstract final class AppColors {
  static const background = Color(0xFF0F1117);
  static const surface = Color(0xFF181C25);
  static const surfaceHigh = Color(0xFF202633);
  static const border = Color(0xFF2A303C);
  static const primary = Color(0xFF7377F5);
  static const onPrimary = Colors.white;
  static const secondary = Color(0xFFAAB4FF);
  static const tertiary = Color(0xFFF5A524);
  static const onBackground = Color(0xFFF5F7FA);
  static const onSurface = Color(0xFFF5F7FA);
  static const onSurfaceVar = Color(0xFFA7AFBE);
  static const error = Color(0xFFE45151);
  static const outline = Color(0xFF4B5568);

  // Semantic status colors. Do not use brand colors to communicate status.
  static const success = Color(0xFF16A36A);
  static const warning = Color(0xFFF5A524);
  static const trial = Color(0xFF9A72FF);
  static const muted = Color(0xFF718096);
}

abstract final class AppTheme {
  static const _scheme = ColorScheme(
    brightness: Brightness.dark,
    primary: AppColors.primary,
    onPrimary: AppColors.onPrimary,
    primaryContainer: Color(0xFF1C3A36),
    onPrimaryContainer: AppColors.primary,
    secondary: AppColors.secondary,
    onSecondary: Color(0xFF001A40),
    secondaryContainer: Color(0xFF0D1F3C),
    onSecondaryContainer: AppColors.secondary,
    tertiary: AppColors.tertiary,
    onTertiary: Color(0xFF4B2800),
    tertiaryContainer: Color(0xFF3A2000),
    onTertiaryContainer: AppColors.tertiary,
    error: AppColors.error,
    onError: Colors.white,
    errorContainer: Color(0xFF4A1010),
    onErrorContainer: AppColors.error,
    surface: AppColors.surface,
    onSurface: AppColors.onSurface,
    surfaceContainerLowest: AppColors.background,
    surfaceContainerLow: Color(0xFF0D1020),
    surfaceContainer: AppColors.surface,
    surfaceContainerHigh: AppColors.surfaceHigh,
    surfaceContainerHighest: Color(0xFF1F2840),
    onSurfaceVariant: AppColors.onSurfaceVar,
    outline: AppColors.outline,
    outlineVariant: AppColors.border,
    shadow: Colors.black,
    scrim: Colors.black,
    inverseSurface: AppColors.onBackground,
    onInverseSurface: AppColors.background,
    inversePrimary: Color(0xFF006B5F),
  );

  static ThemeData get dark {
    final base = GoogleFonts.hankenGroteskTextTheme(
      const TextTheme(
        displayLarge: TextStyle(color: AppColors.onSurface),
        displayMedium: TextStyle(color: AppColors.onSurface),
        displaySmall: TextStyle(color: AppColors.onSurface),
        headlineLarge:
            TextStyle(color: AppColors.onSurface, fontWeight: FontWeight.w800),
        headlineMedium:
            TextStyle(color: AppColors.onSurface, fontWeight: FontWeight.w700),
        headlineSmall:
            TextStyle(color: AppColors.onSurface, fontWeight: FontWeight.w700),
        titleLarge:
            TextStyle(color: AppColors.onSurface, fontWeight: FontWeight.w700),
        titleMedium:
            TextStyle(color: AppColors.onSurface, fontWeight: FontWeight.w600),
        titleSmall:
            TextStyle(color: AppColors.onSurface, fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(color: AppColors.onSurface),
        bodyMedium: TextStyle(color: AppColors.onSurface),
        bodySmall: TextStyle(color: AppColors.onSurfaceVar),
        labelLarge:
            TextStyle(color: AppColors.onSurface, fontWeight: FontWeight.w600),
        labelMedium: TextStyle(color: AppColors.onSurface),
        labelSmall: TextStyle(color: AppColors.onSurfaceVar),
      ),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: _scheme,
      scaffoldBackgroundColor: AppColors.background,
      textTheme: base,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.background,
        surfaceTintColor: Colors.transparent,
        scrolledUnderElevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.light,
        ),
      ),
      cardTheme: const CardThemeData(
        color: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
          side: BorderSide(color: AppColors.border),
        ),
      ),
      navigationBarTheme: const NavigationBarThemeData(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        indicatorColor: Colors.transparent,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceHigh,
        hintStyle: const TextStyle(color: AppColors.onSurfaceVar),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.surfaceHigh,
        selectedColor: AppColors.primary.withValues(alpha: 0.15),
        labelStyle:
            const TextStyle(color: AppColors.onSurfaceVar, fontSize: 13),
        side: const BorderSide(color: AppColors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
        padding: const EdgeInsets.symmetric(horizontal: 4),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.border,
        thickness: 1,
      ),
      listTileTheme: const ListTileThemeData(
        tileColor: Colors.transparent,
        iconColor: AppColors.onSurfaceVar,
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.onPrimary,
        elevation: 0,
        shape: StadiumBorder(),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.primary,
      ),
    );
  }

  static ThemeData get light => dark;
}
