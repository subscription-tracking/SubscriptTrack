import 'package:flutter/material.dart';

/// Uygulama genelinde tekrarlanan onay diyaloglarını (silme, arşivleme, çıkış yapma vb.)
/// standartlaştıran ve 13+ yerdeki boilerplate'i ortadan kaldıran ortak diyalog yardımcısı.
class AppConfirmDialog extends StatelessWidget {
  const AppConfirmDialog({
    required this.title,
    required this.message,
    this.confirmLabel = 'Onayla',
    this.cancelLabel = 'Vazgeç',
    this.isDestructive = false,
    super.key,
  });

  final String title;
  final String message;
  final String confirmLabel;
  final String cancelLabel;
  final bool isDestructive;

  /// Kolay ve tek satırlık çağrı sağlayan static yardımcı fonksiyon.
  /// Kullanıcı onaylarsa `true`, vazgeçer veya dışarı tıklarsa `false` döner.
  static Future<bool> show({
    required BuildContext context,
    required String title,
    required String message,
    String confirmLabel = 'Onayla',
    String cancelLabel = 'Vazgeç',
    bool isDestructive = false,
  }) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AppConfirmDialog(
        title: title,
        message: message,
        confirmLabel: confirmLabel,
        cancelLabel: cancelLabel,
        isDestructive: isDestructive,
      ),
    );
    return result ?? false;
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: Text(cancelLabel),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(context, true),
          style: isDestructive
              ? FilledButton.styleFrom(backgroundColor: cs.error)
              : null,
          child: Text(confirmLabel),
        ),
      ],
    );
  }
}
