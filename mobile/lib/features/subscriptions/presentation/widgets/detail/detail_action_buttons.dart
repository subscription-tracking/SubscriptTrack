import 'package:flutter/material.dart';
import '../../../domain/subscription_models.dart';

class DetailActionButtonsSection extends StatelessWidget {
  const DetailActionButtonsSection({
    required this.subscription,
    required this.onRenewed,
    required this.onPauseResume,
    required this.onArchive,
    required this.onCancel,
    required this.onDelete,
    super.key,
  });

  final Subscription subscription;
  final VoidCallback onRenewed;
  final VoidCallback onPauseResume;
  final VoidCallback onArchive;
  final VoidCallback onCancel;
  final VoidCallback onDelete;

  static final _rounded = RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(16),
  );

  @override
  Widget build(BuildContext context) {
    final isDue = subscription.status == SubscriptionStatus.active &&
        subscription.daysUntilRenewal <= 0;

    return Column(
      children: [
        if (isDue) ...[
          FilledButton.icon(
            onPressed: onRenewed,
            icon: const Icon(Icons.check_circle_outline, size: 18),
            label: const Text('Ödendi ve yenilendi'),
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
              shape: _rounded,
            ),
          ),
          const SizedBox(height: 12),
        ],
        Row(
          children: [
            Expanded(child: _pauseResumeButton(context)),
            const SizedBox(width: 12),
            Expanded(child: _archiveButton(context)),
          ],
        ),
        const SizedBox(height: 12),
        _cancelButton(context),
      ],
    );
  }

  ButtonStyle _outlinedStyle(BuildContext context) => OutlinedButton.styleFrom(
        backgroundColor: Theme.of(context).colorScheme.surface,
        minimumSize: const Size.fromHeight(48),
        shape: _rounded,
      );

  Widget _pauseResumeButton(BuildContext context) {
    final isPaused = subscription.status == SubscriptionStatus.paused;
    return OutlinedButton.icon(
      onPressed: onPauseResume,
      icon: Icon(
        isPaused ? Icons.play_arrow_rounded : Icons.pause_rounded,
        size: 18,
      ),
      label: Text(isPaused ? 'Devam Ettir' : 'Duraklat'),
      style: _outlinedStyle(context),
    );
  }

  Widget _archiveButton(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onArchive,
      icon: const Icon(Icons.archive_outlined, size: 18),
      label: const Text('Arşivle'),
      style: _outlinedStyle(context),
    );
  }

  Widget _cancelButton(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return OutlinedButton.icon(
      onPressed: onCancel,
      icon: Icon(Icons.cancel_outlined, size: 20, color: cs.error),
      label: Text(
        'Aboneliği İptal Et',
        style: TextStyle(color: cs.error, fontWeight: FontWeight.w700),
      ),
      style: OutlinedButton.styleFrom(
        backgroundColor: cs.error.withValues(alpha: 0.08),
        side: BorderSide(color: cs.error.withValues(alpha: 0.3), width: 0.5),
        minimumSize: const Size.fromHeight(50),
        shape: _rounded,
      ),
    );
  }
}
