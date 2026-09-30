import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:material_ui/material_ui.dart' as mui;

import 'app_colors.dart';

export 'app_colors.dart';

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

  static const _baseTextTheme = TextTheme(
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
  );

  static final _filledButtonTheme = FilledButtonThemeData(
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
  );

  static final _outlinedButtonTheme = OutlinedButtonThemeData(
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
  );

  static final _inputDecorationTheme = InputDecorationTheme(
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
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
  );

  static ThemeData get dark {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: _scheme,
      scaffoldBackgroundColor: AppColors.background,
      textTheme: _withHankenGrotesk(_baseTextTheme),
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
      filledButtonTheme: _filledButtonTheme,
      outlinedButtonTheme: _outlinedButtonTheme,
      navigationBarTheme: const NavigationBarThemeData(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        indicatorColor: Colors.transparent,
      ),
      inputDecorationTheme: _inputDecorationTheme,
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
}

/// google_fonts 9, Material'in `material_ui` paketindeki `TextTheme` tipini
/// kullanır; uygulama `flutter/material.dart` tipini kullandığı için stiller
/// alan alan aktarılır (`TextStyle` iki tarafta da aynı tiptir).
TextTheme _withHankenGrotesk(TextTheme t) {
  final styled = GoogleFonts.hankenGroteskTextTheme(mui.TextTheme(
    displayLarge: t.displayLarge,
    displayMedium: t.displayMedium,
    displaySmall: t.displaySmall,
    headlineLarge: t.headlineLarge,
    headlineMedium: t.headlineMedium,
    headlineSmall: t.headlineSmall,
    titleLarge: t.titleLarge,
    titleMedium: t.titleMedium,
    titleSmall: t.titleSmall,
    bodyLarge: t.bodyLarge,
    bodyMedium: t.bodyMedium,
    bodySmall: t.bodySmall,
    labelLarge: t.labelLarge,
    labelMedium: t.labelMedium,
    labelSmall: t.labelSmall,
  ));
  return TextTheme(
    displayLarge: styled.displayLarge,
    displayMedium: styled.displayMedium,
    displaySmall: styled.displaySmall,
    headlineLarge: styled.headlineLarge,
    headlineMedium: styled.headlineMedium,
    headlineSmall: styled.headlineSmall,
    titleLarge: styled.titleLarge,
    titleMedium: styled.titleMedium,
    titleSmall: styled.titleSmall,
    bodyLarge: styled.bodyLarge,
    bodyMedium: styled.bodyMedium,
    bodySmall: styled.bodySmall,
    labelLarge: styled.labelLarge,
    labelMedium: styled.labelMedium,
    labelSmall: styled.labelSmall,
  );
}
