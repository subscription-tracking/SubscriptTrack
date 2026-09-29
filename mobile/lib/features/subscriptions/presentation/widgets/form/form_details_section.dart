import 'package:flutter/material.dart';

import '../../../domain/subscription_models.dart';
import '../form_date_tile.dart';
import '../subscription_form_data.dart';
import '../subscription_form_validators.dart';
import 'form_date_pickers.dart';

/// "Diğer ayrıntılar" bölümü: deneme, kategori, ödeme yöntemi, ilk ödeme,
/// başlangıç tarihi ve not.
class FormDetailsSection extends StatelessWidget {
  const FormDetailsSection({
    required this.data,
    required this.notesController,
    required this.paymentMethods,
    required this.outlineColor,
    required this.expanded,
    required this.onToggle,
    required this.update,
    required this.onPickStart,
    required this.onPickTrialEnd,
    required this.onPickInitialPayment,
    required this.onPickDeferredPayment,
    required this.onAddPaymentMethod,
    super.key,
  });

  final SubscriptionFormData data;
  final TextEditingController notesController;
  final List<String> paymentMethods;
  final Color outlineColor;
  final bool expanded;
  final VoidCallback onToggle;
  final void Function(VoidCallback fn) update;
  final VoidCallback onPickStart;
  final VoidCallback onPickTrialEnd;
  final VoidCallback onPickInitialPayment;
  final VoidCallback onPickDeferredPayment;
  final VoidCallback onAddPaymentMethod;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.tune_rounded),
          title: const Text('Diğer ayrıntılar'),
          subtitle: const Text('Kategori, deneme, ödeme yöntemi ve not'),
          trailing: Icon(expanded ? Icons.expand_less : Icons.chevron_right),
          onTap: () => onToggle(),
        ),
        if (expanded) ...[
          ..._trialFields(),
          const SizedBox(height: 16),
          _categoryField(),
          const SizedBox(height: 16),
          _paymentMethodField(),
          const SizedBox(height: 16),
          _initialPaymentStatusField(),
          const SizedBox(height: 8),
          ..._initialPaymentDate(),
        ],
        const SizedBox(height: 16),
        FormDateTile(
          icon: Icons.play_arrow_outlined,
          label: 'Başlangıç tarihi',
          value: formatFormDate(data.startDate),
          onTap: onPickStart,
          outlineColor: outlineColor,
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: notesController,
          maxLines: 3,
          maxLength: 500,
          textInputAction: TextInputAction.done,
          decoration: const InputDecoration(
            labelText: 'Notlar (isteğe bağlı)',
            prefixIcon: Icon(Icons.notes),
            alignLabelWithHint: true,
          ),
          onChanged: (v) => data.notes = v,
        ),
      ],
    );
  }

  List<Widget> _trialFields() {
    return [
      SwitchListTile.adaptive(
        contentPadding: EdgeInsets.zero,
        title: const Text('Ücretsiz deneme'),
        subtitle: const Text('Deneme bitince ücret alınmaya başlar'),
        value: data.isTrial,
        onChanged: (value) => update(() => data.isTrial = value),
      ),
      if (data.isTrial) ...[
        FormDateTile(
          icon: Icons.hourglass_bottom_outlined,
          label: 'Deneme bitiş tarihi',
          value: _dateOrPrompt(data.trialEndDate),
          onTap: onPickTrialEnd,
          outlineColor: outlineColor,
        ),
        const SizedBox(height: 12),
        TextFormField(
          initialValue: data.trialPriceAfter,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: const InputDecoration(
            labelText: 'Deneme sonrası fiyat',
            prefixIcon: Icon(Icons.payments_outlined),
          ),
          onChanged: (v) => data.trialPriceAfter = v,
          validator: (v) => SubscriptionFormValidators.trialPrice(
            v,
            isTrial: data.isTrial,
            trialEndDate: data.trialEndDate,
          ),
        ),
      ],
    ];
  }

  static String _dateOrPrompt(DateTime? date) =>
      date == null ? 'Tarih seç' : formatFormDate(date);

  Widget _categoryField() {
    return DropdownButtonFormField<SubscriptionCategory>(
      initialValue: data.category,
      decoration: const InputDecoration(
        labelText: 'Kategori',
        prefixIcon: Icon(Icons.category_outlined),
      ),
      items: SubscriptionCategory.values
          .map((c) => DropdownMenuItem(value: c, child: Text(c.label)))
          .toList(),
      onChanged: (v) =>
          update(() => data.category = v ?? SubscriptionCategory.other),
    );
  }

  Widget _paymentMethodField() {
    return DropdownButtonFormField<String?>(
      initialValue: paymentMethods.contains(data.paymentMethod)
          ? data.paymentMethod
          : null,
      decoration: const InputDecoration(
        labelText: 'Ödeme yöntemin (isteğe bağlı)',
        prefixIcon: Icon(Icons.label_outline),
        helperText: 'Sadece takip amaçlıdır; uygulama para çekmez.',
      ),
      items: [
        const DropdownMenuItem<String?>(
            value: null, child: Text('Belirtilmedi')),
        ...paymentMethods.map((method) =>
            DropdownMenuItem<String?>(value: method, child: Text(method))),
        const DropdownMenuItem<String?>(
            value: '__ADD_NEW__', child: Text('+ Yeni yöntem ekle')),
      ],
      onChanged: (value) {
        if (value == '__ADD_NEW__') {
          onAddPaymentMethod();
        } else {
          update(() => data.paymentMethod = value);
        }
      },
    );
  }

  Widget _initialPaymentStatusField() {
    return DropdownButtonFormField<InitialPaymentStatus>(
      initialValue: data.initialPaymentStatus,
      decoration: const InputDecoration(
        labelText: 'İlk ödeme durumu',
        prefixIcon: Icon(Icons.fact_check_outlined),
      ),
      items: const [
        DropdownMenuItem(
            value: InitialPaymentStatus.paid, child: Text('Ödendi')),
        DropdownMenuItem(
            value: InitialPaymentStatus.unpaid, child: Text('Ödenmedi')),
        DropdownMenuItem(
            value: InitialPaymentStatus.deferred, child: Text('Ertelendi')),
      ],
      onChanged: (v) => update(
          () => data.initialPaymentStatus = v ?? InitialPaymentStatus.unpaid),
    );
  }

  List<Widget> _initialPaymentDate() {
    return [
      if (data.initialPaymentStatus == InitialPaymentStatus.paid)
        FormDateTile(
          icon: Icons.event_available_outlined,
          label: 'Ödeme tarihi',
          value: formatFormDate(data.initialPaymentDate),
          onTap: onPickInitialPayment,
          outlineColor: outlineColor,
        ),
      if (data.initialPaymentStatus == InitialPaymentStatus.deferred)
        FormDateTile(
          icon: Icons.event_repeat_outlined,
          label: 'Ertelenen ödeme tarihi',
          value: _dateOrPrompt(data.deferredPaymentDate),
          onTap: onPickDeferredPayment,
          outlineColor: outlineColor,
        ),
    ];
  }
}
