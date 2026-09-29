import 'package:flutter/material.dart';

import '../../../../../core/domain/currency.dart';
import '../../../../../shared/widgets/service_identity.dart';
import '../../../domain/subscription_models.dart';
import '../form_section.dart';
import '../subscription_form_data.dart';
import '../subscription_form_validators.dart';

/// Servis adı, tutar, para birimi ve faturalama döngüsü bölümü.
class FormServiceSection extends StatelessWidget {
  const FormServiceSection({
    required this.data,
    required this.nameController,
    required this.amountController,
    required this.presets,
    required this.outlineColor,
    required this.update,
    super.key,
  });

  final SubscriptionFormData data;
  final TextEditingController nameController;
  final TextEditingController amountController;
  final List<(String, SubscriptionCategory)> presets;
  final Color outlineColor;

  /// Ebeveyn State'in `setState`'i.
  final void Function(VoidCallback fn) update;

  @override
  Widget build(BuildContext context) {
    return FormSection(
      outlineColor: outlineColor,
      children: [
        _presetsTitle(context),
        _presetChips(context),
        const SizedBox(height: 20),
        _nameField(),
        const SizedBox(height: 16),
        _currencyAndAmount(),
        const SizedBox(height: 16),
        _billingCycleField(context),
      ],
    );
  }

  Widget _presetsTitle(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        'Popüler servisler',
        style: theme.textTheme.labelMedium?.copyWith(
          color: theme.colorScheme.onSurface.withValues(alpha: .6),
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _presetChips(BuildContext context) {
    final currentName = data.name.trim().toLowerCase();
    return SizedBox(
      height: 56,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 2),
        itemCount: presets.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final preset = presets[index];
          return _presetChip(
            context,
            preset,
            selected: currentName == preset.$1.trim().toLowerCase(),
          );
        },
      ),
    );
  }

  Widget _presetChip(
    BuildContext context,
    (String, SubscriptionCategory) preset, {
    required bool selected,
  }) {
    final cs = Theme.of(context).colorScheme;
    return ChoiceChip(
      avatar: ServiceIdentity(name: preset.$1, category: preset.$2, size: 26),
      label: Text(
        preset.$1,
        style: TextStyle(
          fontSize: 13,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      backgroundColor: cs.surfaceContainerHigh,
      selectedColor: cs.surfaceContainerHigh,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      side: BorderSide(
        color: selected ? cs.primary : outlineColor,
        width: selected ? 2 : 1,
      ),
      selected: selected,
      showCheckmark: false,
      onSelected: (_) {
        update(() {
          nameController.text = preset.$1;
          data.name = preset.$1;
          data.category = preset.$2;
        });
      },
    );
  }

  Widget _nameField() {
    return TextFormField(
      controller: nameController,
      textCapitalization: TextCapitalization.words,
      textInputAction: TextInputAction.next,
      decoration: InputDecoration(
        labelText: 'Servis',
        hintText: 'Örn. Netflix',
        // S45: ad yazılırken canlı marka rengi/ikon önizlemesi —
        // ServiceIdentity'nin detay ekranında zaten kullanılan aynı
        // marka eşleşmesi.
        prefixIcon: Padding(
          padding: const EdgeInsets.all(8),
          child: ServiceIdentity(
            name: data.name,
            category: data.category,
            size: 28,
          ),
        ),
        suffixIcon: const Icon(Icons.keyboard_arrow_down_rounded),
      ),
      onChanged: (v) => update(() => data.name = v),
      validator: SubscriptionFormValidators.name,
    );
  }

  Widget _currencyAndAmount() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 150,
          child: DropdownButtonFormField<String>(
            initialValue: data.currency,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Para birimi'),
            items: AppCurrency.options
                .map((c) => DropdownMenuItem(
                      value: c.$1,
                      child: Text('${c.$2} ${c.$1}'),
                    ))
                .toList(),
            onChanged: (v) => update(() => data.currency = v ?? 'TRY'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: TextFormField(
            controller: amountController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(labelText: 'Tutar'),
            onChanged: (v) => data.amount = v,
            validator: SubscriptionFormValidators.amount,
          ),
        ),
      ],
    );
  }

  Widget _billingCycleField(BuildContext context) {
    final theme = Theme.of(context);
    return DropdownButtonFormField<BillingCycle>(
      initialValue: data.billingCycle,
      decoration: const InputDecoration(labelText: 'Yenileme sıklığı'),
      style: theme.textTheme.bodyLarge?.copyWith(
        fontWeight: FontWeight.w700,
        color: theme.colorScheme.onSurface,
      ),
      items: BillingCycle.values
          .map((c) => DropdownMenuItem(value: c, child: Text(c.label)))
          .toList(),
      onChanged: (v) => update(() {
        data.billingCycle = v ?? BillingCycle.monthly;
        data.recalculateNextRenewal();
      }),
    );
  }
}
