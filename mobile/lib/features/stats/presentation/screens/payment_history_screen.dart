import 'package:flutter/material.dart';

import '../../../../core/domain/money.dart';
import '../../../../core/utils/date_time_utils.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../../../subscriptions/domain/subscription_models.dart';
import '../../data/payment_events_repository.dart';

class PaymentHistoryScreen extends StatelessWidget {
  const PaymentHistoryScreen({required this.controller, super.key});
  final SubscriptionController controller;

  /// Tutar, kayda geçen [Money.parse] ile aynı kurala göre doğrulanır: yalnızca
  /// en çok iki ondalıklı, sıfırdan büyük sayılar (örn. `1e2` reddedilir —
  /// aksi halde sessizce 0 olarak kaydedilirdi).
  static String? _validateAmount(String? value) {
    final amount = Money.parse((value ?? '').replaceAll(',', '.'));
    return amount.minorUnits > 0 ? null : 'Geçerli tutar gir';
  }

  Future<void> _edit(BuildContext context, PaymentEvent event) async {
    final amount =
        TextEditingController(text: event.amount.amount.toStringAsFixed(2));
    final form = GlobalKey<FormState>();
    await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
              title: const Text('Ödeme kaydını düzenle'),
              content: Form(
                  key: form,
                  child: TextFormField(
                      controller: amount,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                          labelText: 'Tutar (${event.currency})'),
                      validator: _validateAmount)),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('İptal')),
                FilledButton(
                    onPressed: () async {
                      if (!form.currentState!.validate()) return;
                      final ok = await controller.updatePayment(
                          event: PaymentEvent(
                              id: event.id,
                              subscriptionId: event.subscriptionId,
                              amount:
                                  Money.parse(amount.text.replaceAll(',', '.')),
                              currency: event.currency,
                              paidAt: event.paidAt));
                      if (context.mounted && ok) Navigator.pop(context);
                    },
                    child: const Text('Kaydet'))
              ],
            ));
  }

  Future<void> _add(BuildContext context) async {
    final subscriptions = controller.allItems
        .where((s) => s.status != SubscriptionStatus.archived)
        .toList();
    if (subscriptions.isEmpty) return;
    await showDialog<void>(
      context: context,
      builder: (_) => _AddPaymentDialog(
        controller: controller,
        subscriptions: subscriptions,
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Ödeme geçmişi')),
        floatingActionButton: FloatingActionButton.extended(
            onPressed: () => _add(context),
            icon: const Icon(Icons.add),
            label: const Text('Kayıt ekle')),
        body: ListenableBuilder(
            listenable: controller,
            builder: (context, _) {
              final events = controller.paymentEvents;
              if (events.isEmpty) {
                return const Center(
                    child: Text('Henüz manuel ödeme kaydı yok.'));
              }
              return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: events.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, i) {
                    final event = events[i];
                    final sub = controller.allItems
                        .where((s) => s.id == event.subscriptionId)
                        .firstOrNull;
                    return Card(
                        child: ListTile(
                            title: Text(sub?.name ?? 'Silinmiş abonelik'),
                            subtitle: Text(DateTimeUtils.formatDate(
                                event.paidAt.toLocal())),
                            trailing:
                                Row(mainAxisSize: MainAxisSize.min, children: [
                              Text(
                                  DateTimeUtils.formatCurrency(
                                      event.amount.amount,
                                      symbol: event.currency),
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 15)),
                              IconButton(
                                  tooltip: 'Düzenle',
                                  icon: const Icon(Icons.edit_outlined),
                                  onPressed: () => _edit(context, event)),
                              IconButton(
                                  tooltip: 'Sil',
                                  icon: const Icon(Icons.delete_outline),
                                  onPressed: () =>
                                      controller.deletePayment(event.id))
                            ])));
                  });
            }),
      );
}

/// "Ödeme kaydı ekle" iletişim kutusu: abonelik seçimi ve tutar girişi.
class _AddPaymentDialog extends StatefulWidget {
  const _AddPaymentDialog({
    required this.controller,
    required this.subscriptions,
  });

  final SubscriptionController controller;
  final List<Subscription> subscriptions;

  @override
  State<_AddPaymentDialog> createState() => _AddPaymentDialogState();
}

class _AddPaymentDialogState extends State<_AddPaymentDialog> {
  final _formKey = GlobalKey<FormState>();
  late Subscription _selected = widget.subscriptions.first;
  late final TextEditingController _amount =
      TextEditingController(text: _selected.amount.amount.toStringAsFixed(2));

  @override
  void dispose() {
    _amount.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final ok = await widget.controller.recordPayment(
      subscriptionId: _selected.id,
      amount: Money.parse(_amount.text.replaceAll(',', '.')),
      currency: _selected.currency,
    );
    if (mounted && ok) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Ödeme kaydı ekle'),
      content: Form(
        key: _formKey,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          DropdownButtonFormField(
            initialValue: _selected,
            items: widget.subscriptions
                .map((s) => DropdownMenuItem(value: s, child: Text(s.name)))
                .toList(),
            onChanged: (value) {
              if (value == null) return;
              setState(() {
                _selected = value;
                _amount.text = value.amount.amount.toStringAsFixed(2);
              });
            },
            decoration: const InputDecoration(labelText: 'Abonelik'),
          ),
          TextFormField(
            controller: _amount,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration:
                InputDecoration(labelText: 'Tutar (${_selected.currency})'),
            validator: PaymentHistoryScreen._validateAmount,
          ),
        ]),
      ),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal')),
        FilledButton(onPressed: _save, child: const Text('Kaydet')),
      ],
    );
  }
}
