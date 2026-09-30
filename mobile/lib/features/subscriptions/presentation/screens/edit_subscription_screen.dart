import 'package:flutter/material.dart';

import 'package:provider/provider.dart';
import '../../../../core/domain/currency.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../domain/subscription_models.dart';
import '../subscription_controller.dart';
import '../widgets/subscription_form_scaffold.dart';
import '../widgets/subscription_form.dart';

class EditSubscriptionScreen extends StatefulWidget {
  const EditSubscriptionScreen({
    required this.subscription,
    required this.controller,
    super.key,
  });

  final Subscription subscription;
  final SubscriptionController controller;

  @override
  State<EditSubscriptionScreen> createState() => _EditSubscriptionScreenState();
}

class _EditSubscriptionScreenState extends State<EditSubscriptionScreen> {
  final _formKey = GlobalKey<FormState>();
  late final SubscriptionFormData _data;

  @override
  void initState() {
    super.initState();
    final rawCurrency = widget.subscription.currency.trim();
    _data = SubscriptionFormData(
      name: widget.subscription.name,
      amount: widget.subscription.amount.amount.toStringAsFixed(2),
      currency: AppCurrency.normalize(rawCurrency),
      billingCycle: widget.subscription.billingCycle,
      startDate: widget.subscription.startDate,
      nextRenewalDate: widget.subscription.nextRenewalDate,
      category: widget.subscription.category,
      notes: widget.subscription.notes ?? '',
      paymentMethod: widget.subscription.paymentMethod,
      isTrial: widget.subscription.isTrial,
      trialEndDate: widget.subscription.trialEndDate,
      trialPriceAfter:
          widget.subscription.trialPriceAfter?.amount.toStringAsFixed(2) ?? '',
      notificationRules: List.of(widget.subscription.notificationRules),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final updated = _data.applyTo(widget.subscription);

    final ok = await widget.controller.edit(updated);
    if (!mounted) return;
    if (ok) {
      // Detail ekranı da pop edilsin ki stale data göstermesin
      Navigator.pop(context);
      Navigator.pop(context);
    } else {
      showFormSaveError(context, widget.controller);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SubscriptionFormScaffold(
      title: 'Aboneliği düzenle',
      actionLabel: 'Güncelle',
      controller: widget.controller,
      formKey: _formKey,
      data: _data,
      settings: context.read<AppPreferences>(),
      onSave: _save,
      showPresets: false,
    );
  }
}
