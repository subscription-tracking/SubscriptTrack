import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/navigation/app_routes.dart';
import '../../../../core/utils/date_time_utils.dart';
import '../../../subscriptions/domain/subscription_models.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../../../../shared/widgets/service_identity.dart';

class CalendarEventItem extends StatelessWidget {
  const CalendarEventItem({
    required this.subscription,
    required this.controller,
    this.isTrial = false,
    super.key,
  });

  final Subscription subscription;
  final SubscriptionController controller;
  final bool isTrial;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListTile(
        onTap: () => context.push(AppRoutes.subscription(subscription.id)),
        leading: ServiceIdentity(
          name: subscription.name,
          category: subscription.category,
          size: 40,
        ),
        title: Text(
          subscription.name,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle:
            Text(isTrial ? 'Deneme bitişi' : subscription.billingCycle.label),
        trailing: Text(
          DateTimeUtils.formatCurrency(
            subscription.amount.amount,
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
