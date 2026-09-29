import 'package:flutter/material.dart';
import '../../../../../app/theme/app_theme.dart' show AppStatusColorsX;
import '../../../../../core/utils/date_time_utils.dart';
import '../../../../stats/domain/payment_event.dart';
import '../../../domain/subscription_models.dart';
import '../../subscription_controller.dart';

class DetailPaymentHistorySection extends StatelessWidget {
  const DetailPaymentHistorySection({
    required this.subscription,
    required this.controller,
    super.key,
  });

  final Subscription subscription;
  final SubscriptionController controller;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final payments = controller.paymentEvents
        .where((event) => event.subscriptionId == subscription.id)
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 4),
              child: Text(
                'GEÇMİŞ ÖDEMELER',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: cs.onSurfaceVariant,
                  letterSpacing: 1.0,
                ),
              ),
            ),
            TextButton(
              onPressed: payments.isNotEmpty
                  ? () => _showAll(context, payments)
                  : null,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Text(
                'Tümünü gör',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: cs.primary,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: cs.outlineVariant, width: 0.5),
          ),
          child: payments.isEmpty
              ? Padding(
                  padding: const EdgeInsets.all(20),
                  child: Text('Henüz ödeme geçmişi yok',
                      style: TextStyle(color: cs.onSurfaceVariant)),
                )
              : _recentPayments(cs, payments),
        ),
      ],
    );
  }

  /// En son iki ödemeyi ayraçla listeler.
  Widget _recentPayments(ColorScheme cs, List<PaymentEvent> payments) {
    return Column(
      children: [
        for (var i = 0; i < payments.length && i < 2; i++) ...[
          if (i > 0)
            Divider(height: 1, thickness: 0.5, color: cs.outlineVariant),
          DetailHistoryTile(
            dateStr: DateTimeUtils.formatDate(payments[i].paidAt),
            amountStr: DateTimeUtils.formatCurrency(
              payments[i].amount.amount,
              symbol: payments[i].currency,
            ),
            isFirst: i == 0,
          ),
        ],
      ],
    );
  }

  void _showAll(BuildContext context, List<PaymentEvent> payments) {
    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Geçmiş ödemeler'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: payments.length,
            itemBuilder: (_, i) => ListTile(
              title: Text(DateTimeUtils.formatDate(payments[i].paidAt)),
              trailing: Text(DateTimeUtils.formatCurrency(
                payments[i].amount.amount,
                symbol: payments[i].currency,
              )),
            ),
          ),
        ),
      ),
    );
  }
}

class DetailHistoryTile extends StatelessWidget {
  const DetailHistoryTile({
    required this.dateStr,
    required this.amountStr,
    required this.isFirst,
    super.key,
  });

  final String dateStr;
  final String amountStr;
  final bool isFirst;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final statusColors = context.statusColors;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: statusColors.success.withValues(alpha: 0.15),
            ),
            child: Icon(
              Icons.check_circle_rounded,
              size: 18,
              color: statusColors.success,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  dateStr,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: cs.onSurface,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'ÖDENDİ',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: statusColors.success,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
          Text(
            amountStr,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: cs.onSurface,
            ),
          ),
        ],
      ),
    );
  }
}
