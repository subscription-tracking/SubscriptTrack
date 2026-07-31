import 'package:flutter/material.dart';

import '../../../../core/utils/date_time_utils.dart';
import '../../../subscriptions/domain/subscription_models.dart';
import '../../../subscriptions/presentation/screens/subscription_detail_screen.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';

class CalendarEventItem extends StatelessWidget {
  const CalendarEventItem({
    required this.subscription,
    required this.controller,
    super.key,
  });

  final Subscription subscription;
  final SubscriptionController controller;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListTile(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute<void>(
            builder: (_) => SubscriptionDetailScreen(
              subscription: subscription,
              controller: controller,
            ),
          ),
        ),
        leading: CircleAvatar(
          backgroundColor: colors.primaryContainer,
          child: Icon(
            Icons.event_outlined,
            color: colors.onPrimaryContainer,
            size: 20,
          ),
        ),
        title: Text(
          subscription.name,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(subscription.billingCycle.label),
        trailing: Text(
          DateTimeUtils.formatCurrency(
            subscription.amount,
            symbol: subscription.currency,
          ),
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: colors.primary,
          ),
        ),
      ),
    );
  }
}
