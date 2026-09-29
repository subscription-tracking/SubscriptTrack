import 'package:flutter/material.dart';

import '../design/app_tokens.dart';
import 'app_empty_state.dart';
import 'app_offline_banner.dart';

/// Ekranların ortak loading / error / empty / offline dallanmasını tek yerde
/// toplar. Öncelik sırası: yükleniyor (veri yokken) → hata → boş → içerik.
/// Çevrimdışı şeridi her durumda içeriğin üstünde gösterilir.
class AsyncStateView extends StatelessWidget {
  const AsyncStateView({
    required this.child,
    required this.isEmpty,
    this.loading = false,
    this.error,
    this.onRetry,
    this.isOffline = false,
    this.lastSyncAt,
    this.pendingCount = 0,
    this.errorTitle = 'Veriler yüklenemedi',
    this.empty,
    super.key,
  });

  /// Veri hazır olduğunda gösterilecek içerik.
  final Widget child;

  /// Gösterilecek veri yok (liste boş vb.).
  final bool isEmpty;
  final bool loading;
  final String? error;
  final VoidCallback? onRetry;
  final bool isOffline;
  final DateTime? lastSyncAt;
  final int pendingCount;
  final String errorTitle;

  /// Boş durum için özel içerik; verilmezse hiçbir şey çizilmez.
  final Widget? empty;

  @override
  Widget build(BuildContext context) {
    final Widget body;
    if (loading && isEmpty) {
      body = const Center(child: CircularProgressIndicator());
    } else if (error != null) {
      body = Center(
        child: Padding(
          padding: AppSpacing.screen,
          child: AppEmptyState(
            icon: Icons.error_outline,
            title: errorTitle,
            description: error!,
            actionLabel: onRetry == null ? null : 'Tekrar dene',
            onAction: onRetry,
          ),
        ),
      );
    } else if (isEmpty) {
      body = empty ?? const SizedBox.shrink();
    } else {
      body = child;
    }

    return Column(
      children: [
        if (isOffline)
          AppOfflineBanner(
            lastSyncAt: lastSyncAt,
            pendingCount: pendingCount,
            onRetry: onRetry ?? () {},
          ),
        Expanded(child: body),
      ],
    );
  }
}
