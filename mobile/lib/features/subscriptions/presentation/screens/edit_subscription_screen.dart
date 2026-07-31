import 'package:flutter/material.dart';

import '../../domain/subscription_models.dart';
import '../subscription_controller.dart';
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
  State<EditSubscriptionScreen> createState() =>
      _EditSubscriptionScreenState();
}

class _EditSubscriptionScreenState extends State<EditSubscriptionScreen> {
  final _formKey = GlobalKey<FormState>();
  late final SubscriptionFormData _data;

  @override
  void initState() {
    super.initState();
    _data = SubscriptionFormData(
      name: widget.subscription.name,
      amount: widget.subscription.amount.toStringAsFixed(2),
      currency: widget.subscription.currency,
      billingCycle: widget.subscription.billingCycle,
      nextRenewalDate: widget.subscription.nextRenewalDate,
      category: widget.subscription.category,
      notes: widget.subscription.notes ?? '',
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final amount =
        double.tryParse(_data.amount.replaceAll(',', '.')) ?? 0;

    final updated = widget.subscription.copyWith(
      name: _data.name,
      amount: amount,
      currency: _data.currency,
      billingCycle: _data.billingCycle,
      nextRenewalDate: _data.nextRenewalDate,
      category: _data.category,
      notes: _data.notes.trim().isEmpty ? null : _data.notes.trim(),
    );

    final ok = await widget.controller.edit(updated);
    if (!mounted) return;
    if (ok) {
      // Detail ekranı da pop edilsin ki stale data göstermesin
      Navigator.pop(context);
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content:
              Text(widget.controller.error ?? 'Bir hata oluştu.'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
      widget.controller.clearError();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Aboneliği düzenle')),
      body: ListenableBuilder(
        listenable: widget.controller,
        builder: (context, _) => ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          children: [
            SubscriptionForm(formKey: _formKey, data: _data),
            const SizedBox(height: 28),
            FilledButton(
              onPressed: widget.controller.loading ? null : _save,
              child: widget.controller.loading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Güncelle'),
            ),
          ],
        ),
      ),
    );
  }
}
