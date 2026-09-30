import 'package:flutter/material.dart';

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
