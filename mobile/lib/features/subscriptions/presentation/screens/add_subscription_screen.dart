import 'package:flutter/material.dart';

import '../subscription_controller.dart';
import '../widgets/subscription_form.dart';

class AddSubscriptionScreen extends StatefulWidget {
  const AddSubscriptionScreen({required this.controller, super.key});

  final SubscriptionController controller;

  @override
  State<AddSubscriptionScreen> createState() => _AddSubscriptionScreenState();
}

class _AddSubscriptionScreenState extends State<AddSubscriptionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _data = SubscriptionFormData();

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final amount =
        double.tryParse(_data.amount.replaceAll(',', '.')) ?? 0;

    final ok = await widget.controller.add(
      name: _data.name,
      amount: amount,
      currency: _data.currency,
      billingCycle: _data.billingCycle,
      startDate: _data.startDate,
      nextRenewalDate: _data.nextRenewalDate,
      category: _data.category,
      notes: _data.notes.trim().isEmpty ? null : _data.notes.trim(),
    );

    if (!mounted) return;
    if (ok) {
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.controller.error ?? 'Bir hata oluştu.'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
      widget.controller.clearError();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Abonelik ekle')),
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
                  : const Text('Kaydet'),
            ),
          ],
        ),
      ),
    );
  }
}
