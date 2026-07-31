import 'package:flutter/material.dart';

import '../../domain/subscription_models.dart';

class SubscriptionFormData {
  SubscriptionFormData({
    this.name = '',
    this.amount = '',
    this.currency = '₺',
    this.billingCycle = BillingCycle.monthly,
    DateTime? nextRenewalDate,
    this.category = SubscriptionCategory.other,
    this.notes = '',
  }) : nextRenewalDate =
            nextRenewalDate ?? DateTime.now().add(const Duration(days: 30));

  String name;
  String amount;
  String currency;
  BillingCycle billingCycle;
  DateTime nextRenewalDate;
  SubscriptionCategory category;
  String notes;
}

class SubscriptionForm extends StatefulWidget {
  const SubscriptionForm({
    required this.formKey,
    required this.data,
    super.key,
  });

  final GlobalKey<FormState> formKey;
  final SubscriptionFormData data;

  @override
  State<SubscriptionForm> createState() => _SubscriptionFormState();
}

class _SubscriptionFormState extends State<SubscriptionForm> {
  late final TextEditingController _name;
  late final TextEditingController _amount;
  late final TextEditingController _notes;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.data.name);
    _amount = TextEditingController(text: widget.data.amount);
    _notes = TextEditingController(text: widget.data.notes);
  }

  @override
  void dispose() {
    _name.dispose();
    _amount.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: widget.data.nextRenewalDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 3)),
    );
    if (picked != null) {
      setState(() => widget.data.nextRenewalDate = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: widget.formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextFormField(
            controller: _name,
            textCapitalization: TextCapitalization.words,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(
              labelText: 'Abonelik adı',
              hintText: 'Örn. Netflix',
              prefixIcon: Icon(Icons.label_outline),
            ),
            onChanged: (v) => widget.data.name = v,
            validator: (v) =>
                v == null || v.trim().isEmpty ? 'Ad boş olamaz' : null,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              SizedBox(
                width: 72,
                child: DropdownButtonFormField<String>(
                  initialValue: widget.data.currency,
                  decoration: const InputDecoration(labelText: 'Para'),
                  items: const ['₺', '\$', '€', '£']
                      .map((c) =>
                          DropdownMenuItem(value: c, child: Text(c)))
                      .toList(),
                  onChanged: (v) =>
                      setState(() => widget.data.currency = v ?? '₺'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  controller: _amount,
                  keyboardType: const TextInputType.numberWithOptions(
                      decimal: true),
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'Tutar',
                    prefixIcon: Icon(Icons.payments_outlined),
                  ),
                  onChanged: (v) => widget.data.amount = v,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) {
                      return 'Tutar gir';
                    }
                    final n = double.tryParse(v.replaceAll(',', '.'));
                    if (n == null || n <= 0) return 'Geçerli tutar gir';
                    return null;
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<BillingCycle>(
            initialValue: widget.data.billingCycle,
            decoration: const InputDecoration(
              labelText: 'Ödeme döngüsü',
              prefixIcon: Icon(Icons.repeat),
            ),
            items: BillingCycle.values
                .map((c) => DropdownMenuItem(
                    value: c, child: Text(c.label)))
                .toList(),
            onChanged: (v) =>
                setState(() => widget.data.billingCycle = v ?? BillingCycle.monthly),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<SubscriptionCategory>(
            initialValue: widget.data.category,
            decoration: const InputDecoration(
              labelText: 'Kategori',
              prefixIcon: Icon(Icons.category_outlined),
            ),
            items: SubscriptionCategory.values
                .map((c) => DropdownMenuItem(
                    value: c, child: Text(c.label)))
                .toList(),
            onChanged: (v) => setState(
                () => widget.data.category = v ?? SubscriptionCategory.other),
          ),
          const SizedBox(height: 16),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.calendar_today_outlined),
            title: const Text('Sonraki yenileme'),
            subtitle: Text(
              '${widget.data.nextRenewalDate.day}/'
              '${widget.data.nextRenewalDate.month}/'
              '${widget.data.nextRenewalDate.year}',
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: _pickDate,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(
                  color: Theme.of(context).colorScheme.outline.withValues(alpha: .5)),
            ),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _notes,
            maxLines: 3,
            textInputAction: TextInputAction.done,
            decoration: const InputDecoration(
              labelText: 'Notlar (opsiyonel)',
              prefixIcon: Icon(Icons.notes),
              alignLabelWithHint: true,
            ),
            onChanged: (v) => widget.data.notes = v,
          ),
        ],
      ),
    );
  }
}
