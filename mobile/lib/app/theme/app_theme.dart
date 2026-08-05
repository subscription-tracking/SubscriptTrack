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

abstract final class AppLightColors {
  static const background = Color(0xFFF4F6FB);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceHigh = Color(0xFFEDF0F7);
  static const border = Color(0xFFD5DAE8);
  static const primary = Color(0xFF5558E3);
  static const onPrimary = Colors.white;
  static const secondary = Color(0xFF4558D4);
  static const tertiary = Color(0xFFB45309);
  static const onBackground = Color(0xFF0F1117);
  static const onSurface = Color(0xFF0F1117);
  static const onSurfaceVar = Color(0xFF5B6478);
  static const error = Color(0xFFC9303A);
  static const outline = Color(0xFF8792A8);

  static const success = Color(0xFF0D9155);
  static const warning = Color(0xFFD97706);
  static const trial = Color(0xFF6B42D4);
  static const muted = Color(0xFF8792A8);
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

  static const _lightScheme = ColorScheme(
    brightness: Brightness.light,
    primary: AppLightColors.primary,
    onPrimary: AppLightColors.onPrimary,
    primaryContainer: Color(0xFFE8E8FD),
    onPrimaryContainer: Color(0xFF2D2E9E),
    secondary: AppLightColors.secondary,
    onSecondary: Colors.white,
    secondaryContainer: Color(0xFFE6E9FC),
    onSecondaryContainer: Color(0xFF1A2AA0),
    tertiary: AppLightColors.tertiary,
    onTertiary: Colors.white,
    tertiaryContainer: Color(0xFFFEF3C7),
    onTertiaryContainer: Color(0xFF78350F),
    error: AppLightColors.error,
    onError: Colors.white,
    errorContainer: Color(0xFFFEE2E2),
    onErrorContainer: Color(0xFF7F1D1D),
    surface: AppLightColors.surface,
    onSurface: AppLightColors.onSurface,
    surfaceContainerLowest: AppLightColors.background,
    surfaceContainerLow: AppLightColors.surfaceHigh,
    surfaceContainer: AppLightColors.surface,
    surfaceContainerHigh: AppLightColors.surfaceHigh,
    surfaceContainerHighest: Color(0xFFE5E9F0),
    onSurfaceVariant: AppLightColors.onSurfaceVar,
    outline: AppLightColors.outline,
    outlineVariant: AppLightColors.border,
    shadow: Colors.black,
    scrim: Colors.black,
    inverseSurface: AppLightColors.onBackground,
    onInverseSurface: AppLightColors.background,
    inversePrimary: AppColors.secondary,
  );

  static ThemeData get light {
    final base = GoogleFonts.hankenGroteskTextTheme(
      const TextTheme(
        displayLarge: TextStyle(color: AppLightColors.onSurface),
        displayMedium: TextStyle(color: AppLightColors.onSurface),
        displaySmall: TextStyle(color: AppLightColors.onSurface),
        headlineLarge: TextStyle(
            color: AppLightColors.onSurface, fontWeight: FontWeight.w800),
        headlineMedium: TextStyle(
            color: AppLightColors.onSurface, fontWeight: FontWeight.w700),
        headlineSmall: TextStyle(
            color: AppLightColors.onSurface, fontWeight: FontWeight.w700),
        titleLarge: TextStyle(
            color: AppLightColors.onSurface, fontWeight: FontWeight.w700),
        titleMedium: TextStyle(
            color: AppLightColors.onSurface, fontWeight: FontWeight.w600),
        titleSmall: TextStyle(
            color: AppLightColors.onSurface, fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(color: AppLightColors.onSurface),
        bodyMedium: TextStyle(color: AppLightColors.onSurface),
        bodySmall: TextStyle(color: AppLightColors.onSurfaceVar),
        labelLarge: TextStyle(
            color: AppLightColors.onSurface, fontWeight: FontWeight.w600),
        labelMedium: TextStyle(color: AppLightColors.onSurface),
        labelSmall: TextStyle(color: AppLightColors.onSurfaceVar),
      ),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: _lightScheme,
      scaffoldBackgroundColor: AppLightColors.background,
      textTheme: base,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppLightColors.background,
        surfaceTintColor: Colors.transparent,
        scrolledUnderElevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark,
        ),
      ),
      cardTheme: const CardThemeData(
        color: AppLightColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
          side: BorderSide(color: AppLightColors.border),
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
        fillColor: AppLightColors.surfaceHigh,
        hintStyle: const TextStyle(color: AppLightColors.onSurfaceVar),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppLightColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppLightColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide:
              const BorderSide(color: AppLightColors.primary, width: 1.5),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppLightColors.surfaceHigh,
        selectedColor: AppLightColors.primary.withValues(alpha: 0.12),
        labelStyle: const TextStyle(
            color: AppLightColors.onSurfaceVar, fontSize: 13),
        side: const BorderSide(color: AppLightColors.border),
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
        padding: const EdgeInsets.symmetric(horizontal: 4),
      ),
      dividerTheme: const DividerThemeData(
        color: AppLightColors.border,
        thickness: 1,
      ),
      listTileTheme: const ListTileThemeData(
        tileColor: Colors.transparent,
        iconColor: AppLightColors.onSurfaceVar,
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppLightColors.primary,
        foregroundColor: AppLightColors.onPrimary,
        elevation: 0,
        shape: StadiumBorder(),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppLightColors.primary,
      ),
    );
  }
}
