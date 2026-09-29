import 'package:flutter/material.dart';
import '../../../domain/subscription_models.dart';

/// Detay kartlarının üstündeki küçük büyük-harfli bölüm başlığı.
class _SectionCaption extends StatelessWidget {
  const _SectionCaption(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: Theme.of(context).colorScheme.onSurfaceVariant,
        letterSpacing: 1.0,
      ),
    );
  }
}

/// Başlığın sağındaki kompakt metin düğmesi ("Değiştir", "Düzenle").
class _CompactTextButton extends StatelessWidget {
  const _CompactTextButton({required this.label, required this.onPressed});

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onPressed,
      style: TextButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }
}

/// Yuvarlatılmış, çerçeveli detay kartı.
class _SurfaceCard extends StatelessWidget {
  const _SurfaceCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cs.outlineVariant, width: 0.5),
      ),
      child: child,
    );
  }
}

class DetailPaymentMethodSection extends StatelessWidget {
  const DetailPaymentMethodSection({
    required this.subscription,
    required this.onChange,
    super.key,
  });

  final Subscription subscription;
  final VoidCallback onChange;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final method = subscription.paymentMethod;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(left: 4, bottom: 8),
          child: _SectionCaption('ÖDEME YÖNTEMİ'),
        ),
        _SurfaceCard(
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.credit_card_rounded,
                  color: cs.secondary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      method ?? 'Belirtilmedi',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: cs.onSurface,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      method != null
                          ? 'Kayıtlı ödeme yöntemi'
                          : 'Ödeme yöntemi seçilmedi',
                      style: TextStyle(
                        fontSize: 12,
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              _CompactTextButton(label: 'Değiştir', onPressed: onChange),
            ],
          ),
        ),
      ],
    );
  }
}

class DetailReminderSection extends StatelessWidget {
  const DetailReminderSection({
    required this.subscription,
    required this.onEdit,
    super.key,
  });

  final Subscription subscription;
  final VoidCallback onEdit;

  String _label(int daysBefore) =>
      daysBefore == 0 ? 'Aynı gün' : '$daysBefore gün önce';

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final rules = subscription.notificationRules
        .where((r) => r.enabled)
        .toList()
      ..sort((a, b) => a.daysBefore.compareTo(b.daysBefore));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const _SectionCaption('HATIRLATMALAR'),
              _CompactTextButton(label: 'Düzenle', onPressed: onEdit),
            ],
          ),
        ),
        _SurfaceCard(
          child: rules.isEmpty
              ? Text('Bu abonelik için hatırlatma kapalı.',
                  style: TextStyle(color: cs.onSurfaceVariant))
              : Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final r in rules)
                      Chip(
                        label: Text(_label(r.daysBefore)),
                        visualDensity: VisualDensity.compact,
                        backgroundColor: cs.primary.withValues(alpha: 0.1),
                        side: BorderSide.none,
                        labelStyle: TextStyle(
                          color: cs.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
        ),
      ],
    );
  }
}
