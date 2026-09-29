import 'package:flutter/material.dart';

import '../../../app/theme/app_theme.dart' show AppStatusColorsX;

/// Uygulama genelinde standart çevrimdışı (offline) durum bildirim şeridi.
/// Dashboard ve Liste ekranlarında tekrarlanan _OfflineBanner sınıflarını birleştirir.
class AppOfflineBanner extends StatelessWidget {
  const AppOfflineBanner({
    required this.onRetry,
    this.lastSyncAt,
    this.pendingCount = 0,
    super.key,
  });

  final VoidCallback onRetry;
  final DateTime? lastSyncAt;
  final int pendingCount;

  @override
  Widget build(BuildContext context) {
    final statusColors = context.statusColors;
    final base = lastSyncAt == null
        ? 'Çevrimdışı — önbellek gösteriliyor'
        : 'Çevrimdışı — ${_formatRelativeTime(lastSyncAt!)} önce güncellendi';
    final label =
        pendingCount > 0 ? '$base · $pendingCount işlem bekliyor' : base;

    return MaterialBanner(
      backgroundColor: statusColors.warning.withValues(alpha: 0.12),
      content: Text(
        label,
        style: TextStyle(color: statusColors.warning),
      ),
      actions: [
        TextButton(
          onPressed: onRetry,
          child: const Text('Yenile'),
        ),
      ],
    );
  }

  static String _formatRelativeTime(DateTime utc) {
    final diff = DateTime.now().toUtc().difference(utc);
    if (diff.inSeconds < 60) return '${diff.inSeconds} sn';
    if (diff.inMinutes < 60) return '${diff.inMinutes} dk';
    if (diff.inHours < 24) return '${diff.inHours} sa';
    return '${diff.inDays} gün';
  }
}

/// Çevrimdışıysa [AppOfflineBanner], değilse ve bir hata varsa kapatılabilir
/// hata bandı; ikisi de yoksa boş.
class AppStatusBanner extends StatelessWidget {
  const AppStatusBanner({
    required this.isOffline,
    required this.onRetry,
    required this.onDismissError,
    this.error,
    this.lastSyncAt,
    this.pendingCount = 0,
    super.key,
  });

  final bool isOffline;
  final String? error;
  final DateTime? lastSyncAt;
  final int pendingCount;
  final VoidCallback onRetry;
  final VoidCallback onDismissError;

  @override
  Widget build(BuildContext context) {
    if (isOffline) {
      return AppOfflineBanner(
        lastSyncAt: lastSyncAt,
        pendingCount: pendingCount,
        onRetry: onRetry,
      );
    }
    final message = error;
    if (message == null) return const SizedBox.shrink();
    return MaterialBanner(
      content: Text(message),
      actions: [
        TextButton(onPressed: onDismissError, child: const Text('Kapat')),
        TextButton(onPressed: onRetry, child: const Text('Tekrar dene')),
      ],
    );
  }
}
