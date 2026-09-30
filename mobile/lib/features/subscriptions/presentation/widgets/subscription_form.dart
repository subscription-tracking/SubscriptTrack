import 'package:flutter/material.dart';

import '../../../../core/errors/error_messages.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../../../../core/config/app_environment.dart';
import '../../../../core/network/support_catalog_api.dart';
import '../../domain/subscription_models.dart';
import 'form/form_date_pickers.dart';
import 'form/form_details_section.dart';
import 'form/form_renewal_section.dart';
import 'form/form_service_section.dart';
import 'form/quick_add_payment_method_dialog.dart';
import 'form/subscription_presets.dart';
import 'subscription_form_data.dart';

export 'subscription_form_data.dart';

class SubscriptionForm extends StatefulWidget {
  const SubscriptionForm({
    required this.formKey,
    required this.data,
    this.settings,
    this.showPresets = true,
    super.key,
  });

  /// Yeni abonelik eklerken "Popüler servisler" çiplerini gösterir; düzenlemede
  /// bir çip mevcut aboneliğin adını ezeceğinden kapatılır.
  final bool showPresets;

  final GlobalKey<FormState> formKey;
  final SubscriptionFormData data;

  /// Ödeme yöntemi listesi kaynağı; verilmezse varsayılan ayarlarla yeni bir
  /// [InMemoryAppPreferences] kullanılır (yalnızca izole testler için).
  final AppPreferences? settings;

  @override
  State<SubscriptionForm> createState() => _SubscriptionFormState();
}

class _SubscriptionFormState extends State<SubscriptionForm> {
  late final TextEditingController _name;
  late final TextEditingController _amount;
  late final TextEditingController _notes;
  late final AppPreferences _settings =
      widget.settings ?? InMemoryAppPreferences();
  bool _showDetails = false;
  late List<(String, SubscriptionCategory)> _presets;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.data.name);
    _amount = TextEditingController(text: widget.data.amount);
    _notes = TextEditingController(text: widget.data.notes);
    _presets = popularSubscriptionPresets;
    _loadRemoteCatalog();
  }

  Future<void> _loadRemoteCatalog() async {
    if (!EnvironmentConfig.isSupabaseConfigured) return;
    try {
      final remote = await SupportCatalogApi().fetchCatalog();
      final mapped = remote
          .map((row) => (
                row['name'] as String,
                SubscriptionCategoryLabel.fromKey(
                    row['category'] as String? ?? 'other'),
              ))
          .toList();
      if (mounted && mapped.isNotEmpty) setState(() => _presets = mapped);
    } catch (e) {
      // Static presets remain available when the catalog API is offline.
      logIgnoredError('SubscriptionForm.catalog', e);
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _amount.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _pick(
    Future<bool> Function(BuildContext, SubscriptionFormData) picker,
  ) async {
    final changed = await picker(context, widget.data);
    if (changed && mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final outlineColor =
        Theme.of(context).colorScheme.outline.withValues(alpha: .5);
    final data = widget.data;

    return Form(
      key: widget.formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          FormServiceSection(
            data: data,
            nameController: _name,
            amountController: _amount,
            presets: _presets,
            showPresets: widget.showPresets,
            outlineColor: outlineColor,
            update: setState,
          ),
          const SizedBox(height: 16),
          FormRenewalSection(
            data: data,
            outlineColor: outlineColor,
            update: setState,
            onPickNextRenewal: () => _pick(FormDatePickers.nextRenewal),
          ),
          const SizedBox(height: 8),
          FormDetailsSection(
            data: data,
            notesController: _notes,
            paymentMethods: _settings.paymentMethods,
            outlineColor: outlineColor,
            expanded: _showDetails,
            onToggle: () => setState(() => _showDetails = !_showDetails),
            update: setState,
            onPickStart: () => _pick(FormDatePickers.startDate),
            onPickTrialEnd: () => _pick(FormDatePickers.trialEnd),
            onPickInitialPayment: () => _pick(FormDatePickers.initialPayment),
            onPickDeferredPayment: () => _pick(FormDatePickers.deferredPayment),
            onAddPaymentMethod: () => showQuickAddPaymentMethodDialog(
              context,
              onAdded: (value) {
                _settings.addPaymentMethod(value);
                setState(() => data.paymentMethod = value);
              },
            ),
          ),
        ],
      ),
    );
  }
}
