import 'package:flutter/material.dart';

import '../../../../core/domain/money.dart';
import '../../../../core/utils/date_time_utils.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../../../subscriptions/domain/subscription_models.dart';
import '../../data/payment_events_repository.dart';

class PaymentHistoryScreen extends StatelessWidget {
  const PaymentHistoryScreen({required this.controller, super.key});
  final SubscriptionController controller;

  Future<void> _edit(BuildContext context, PaymentEvent event) async {
    final amount = TextEditingController(text: event.amount.amount.toStringAsFixed(2));
    final form = GlobalKey<FormState>();
    await showDialog<void>(context: context, builder: (context) => AlertDialog(
      title: const Text('Ödeme kaydını düzenle'),
      content: Form(key: form, child: TextFormField(controller: amount, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: InputDecoration(labelText: 'Tutar (${event.currency})'), validator: (v) => double.tryParse((v ?? '').replaceAll(',', '.')) == null ? 'Geçerli tutar gir' : null)),
      actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('İptal')), FilledButton(onPressed: () async { if (!form.currentState!.validate()) return; final ok = await controller.updatePayment(event: PaymentEvent(id: event.id, subscriptionId: event.subscriptionId, amount: Money.parse(amount.text.replaceAll(',', '.')), currency: event.currency, paidAt: event.paidAt)); if (context.mounted && ok) Navigator.pop(context); }, child: const Text('Kaydet'))],
    ));
  }

  Future<void> _add(BuildContext context) async {
    final subscriptions = controller.allItems
        .where((s) => s.status != SubscriptionStatus.archived)
        .toList();
    if (subscriptions.isEmpty) return;
    var selected = subscriptions.first;
    final amount = TextEditingController(text: selected.amount.amount.toStringAsFixed(2));
    final formKey = GlobalKey<FormState>();
    await showDialog<void>(
      context: context,
      builder: (context) => StatefulBuilder(builder: (context, setState) => AlertDialog(
        title: const Text('Ödeme kaydı ekle'),
        content: Form(key: formKey, child: Column(mainAxisSize: MainAxisSize.min, children: [
          DropdownButtonFormField(
            initialValue: selected,
            items: subscriptions.map((s) => DropdownMenuItem(value: s, child: Text(s.name))).toList(),
            onChanged: (value) { if (value != null) setState(() { selected = value; amount.text = selected.amount.amount.toStringAsFixed(2); }); },
            decoration: const InputDecoration(labelText: 'Abonelik'),
          ),
          TextFormField(controller: amount, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: InputDecoration(labelText: 'Tutar (${selected.currency})'), validator: (v) => double.tryParse((v ?? '').replaceAll(',', '.')) == null ? 'Geçerli tutar gir' : null),
        ])),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('İptal')),
          FilledButton(onPressed: () async { if (!formKey.currentState!.validate()) return; final ok = await controller.recordPayment(subscriptionId: selected.id, amount: Money.parse(amount.text.replaceAll(',', '.')), currency: selected.currency); if (context.mounted && ok) Navigator.pop(context); }, child: const Text('Kaydet')),
        ],
      )),
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Ödeme geçmişi')),
    floatingActionButton: FloatingActionButton.extended(onPressed: () => _add(context), icon: const Icon(Icons.add), label: const Text('Kayıt ekle')),
    body: ListenableBuilder(listenable: controller, builder: (context, _) {
      final events = controller.paymentEvents;
      if (events.isEmpty) return const Center(child: Text('Henüz manuel ödeme kaydı yok.'));
      return ListView.separated(padding: const EdgeInsets.all(16), itemCount: events.length, separatorBuilder: (_, __) => const SizedBox(height: 8), itemBuilder: (context, i) {
        final event = events[i];
        final sub = controller.allItems.where((s) => s.id == event.subscriptionId).firstOrNull;
        return Card(child: ListTile(title: Text(sub?.name ?? 'Silinmiş abonelik'), subtitle: Text(DateTimeUtils.formatDate(event.paidAt.toLocal())), trailing: Row(mainAxisSize: MainAxisSize.min, children: [Text(DateTimeUtils.formatCurrency(event.amount.amount, symbol: event.currency)), IconButton(tooltip: 'Düzenle', icon: const Icon(Icons.edit_outlined), onPressed: () => _edit(context, event)), IconButton(tooltip: 'Sil', icon: const Icon(Icons.delete_outline), onPressed: () => controller.deletePayment(event.id))])));
      });
    }),
  );
}
