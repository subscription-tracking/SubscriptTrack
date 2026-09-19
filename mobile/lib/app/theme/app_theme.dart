import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

abstract final class AppColors {
  // Dark palette: neutral slate surfaces with a single restrained indigo brand
  // accent. Semantic colours communicate state only; they are not decoration.
  static const background = Color(0xFF101217);
  static const surface = Color(0xFF181B22);
  static const surfaceHigh = Color(0xFF20242D);
  static const border = Color(0xFF2B303B);
  static const primary = Color(0xFF8B8CF7);
  static const onPrimary = Color(0xFF171824);
  static const secondary = Color(0xFFB5B6FF);
  static const tertiary = Color(0xFFD6A15A);
  static const onBackground = Color(0xFFF2F4F7);
  static const onSurface = Color(0xFFF2F4F7);
  static const onSurfaceVar = Color(0xFFAAB1C0);
  static const error = Color(0xFFD77979);
  static const outline = Color(0xFF4C5361);

  // Semantic status colors. Do not use brand colors to communicate status.
  static const success = Color(0xFF78A987);
  static const warning = Color(0xFFD6A15A);
  static const trial = Color(0xFF9B9BD8);
  static const muted = Color(0xFF737B8C);
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

/// Durum renkleri (`success`/`warning`/`trial`/`muted`) Material'ın
/// [ColorScheme]'inde karşılığı olmayan özel semantik renklerdir — bu yüzden
/// tema geçişinde doğru varyantı seçebilmek için bir [ThemeExtension] olarak
/// tanımlanıyor. Kullanım: `Theme.of(context).extension<AppStatusColors>()!`.
@immutable
class AppStatusColors extends ThemeExtension<AppStatusColors> {
  const AppStatusColors({
    required this.success,
    required this.warning,
    required this.trial,
    required this.muted,
  });

  final Color success;
  final Color warning;
  final Color trial;
  final Color muted;

  static const dark = AppStatusColors(
    success: AppColors.success,
    warning: AppColors.warning,
    trial: AppColors.trial,
    muted: AppColors.muted,
  );

  static const light = AppStatusColors(
    success: AppLightColors.success,
    warning: AppLightColors.warning,
    trial: AppLightColors.trial,
    muted: AppLightColors.muted,
  );

  @override
  AppStatusColors copyWith({
    Color? success,
    Color? warning,
    Color? trial,
    Color? muted,
  }) =>
      AppStatusColors(
        success: success ?? this.success,
        warning: warning ?? this.warning,
        trial: trial ?? this.trial,
        muted: muted ?? this.muted,
      );

  @override
  AppStatusColors lerp(ThemeExtension<AppStatusColors>? other, double t) {
    if (other is! AppStatusColors) return this;
    return AppStatusColors(
      success: Color.lerp(success, other.success, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      trial: Color.lerp(trial, other.trial, t)!,
      muted: Color.lerp(muted, other.muted, t)!,
    );
  }
}

extension AppStatusColorsX on BuildContext {
  AppStatusColors get statusColors =>
      Theme.of(this).extension<AppStatusColors>() ?? AppStatusColors.dark;
}

abstract final class AppTheme {
  static const _scheme = ColorScheme(
    brightness: Brightness.dark,
    primary: AppColors.primary,
    onPrimary: AppColors.onPrimary,
    primaryContainer: Color(0xFF252746),
    onPrimaryContainer: Color(0xFFC7C8FF),
    secondary: AppColors.secondary,
    onSecondary: Color(0xFF1A1B2C),
    secondaryContainer: Color(0xFF252834),
    onSecondaryContainer: AppColors.secondary,
    tertiary: AppColors.tertiary,
    onTertiary: Color(0xFF2B2115),
    tertiaryContainer: Color(0xFF2B261E),
    onTertiaryContainer: Color(0xFFF0C58A),
    error: AppColors.error,
    onError: Colors.white,
    errorContainer: Color(0xFF352124),
    onErrorContainer: Color(0xFFF0B4B4),
    surface: AppColors.surface,
    onSurface: AppColors.onSurface,
    surfaceContainerLowest: AppColors.background,
    surfaceContainerLow: Color(0xFF151820),
    surfaceContainer: AppColors.surface,
    surfaceContainerHigh: AppColors.surfaceHigh,
    surfaceContainerHighest: Color(0xFF252A33),
    onSurfaceVariant: AppColors.onSurfaceVar,
    outline: AppColors.outline,
    outlineVariant: AppColors.border,
    shadow: Colors.black,
    scrim: Colors.black,
    inverseSurface: AppColors.onBackground,
    onInverseSurface: AppColors.background,
    inversePrimary: Color(0xFF5556C9),
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
          borderRadius: BorderRadius.all(Radius.circular(20)),
          side: BorderSide(color: AppColors.border, width: 0.5),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.onPrimary,
          elevation: 0,
          minimumSize: const Size.fromHeight(50),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: 0,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.onSurface,
          minimumSize: const Size.fromHeight(50),
          side: const BorderSide(color: AppColors.border, width: 0.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
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
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.border, width: 0.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.border, width: 0.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
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
        side: const BorderSide(color: AppColors.border, width: 0.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
        padding: const EdgeInsets.symmetric(horizontal: 4),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.border,
        thickness: 0.5,
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
      extensions: const [AppStatusColors.dark],
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
        labelStyle:
            const TextStyle(color: AppLightColors.onSurfaceVar, fontSize: 13),
        side: const BorderSide(color: AppLightColors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
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
      extensions: const [AppStatusColors.light],
    );
  }
}
