import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:provider/provider.dart';
import '../../../../core/navigation/app_routes.dart';
import '../../../../core/domain/money.dart';
import '../../../../core/services/notification_scheduler.dart';
import '../../../../core/preferences/app_preferences.dart';
import '../subscription_controller.dart';
import '../widgets/subscription_form_scaffold.dart';
import '../widgets/subscription_form.dart';

class AddSubscriptionScreen extends StatefulWidget {
  const AddSubscriptionScreen({
    required this.controller,
    this.initialStartDate,
    super.key,
  });

  final SubscriptionController controller;

  /// S45: takvimde seçili bir güne "bu tarihte başlayan abonelik ekle" ile
  /// gelindiyse, formun başlangıç tarihini o günle önceden doldurur.
  final DateTime? initialStartDate;

  @override
  State<AddSubscriptionScreen> createState() => _AddSubscriptionScreenState();
}

class _AddSubscriptionScreenState extends State<AddSubscriptionScreen> {
  final _formKey = GlobalKey<FormState>();
  late final AppPreferences _preferences = context.read<AppPreferences>();
  late final NotificationScheduler _notifications =
      context.read<NotificationScheduler>();
  late final _data = SubscriptionFormData(
    startDate: widget.initialStartDate,
    currency: _preferences.currency,
  );

  /// Test 7: aynı isimde bir abonelik zaten varsa, sessizce ikinci bir kayıt
  /// oluşturmak yerine kullanıcıya sorup onay istiyoruz — davranış tutarlı
  /// ve görünür (izin veriliyor ama artık bilgilendiriliyor).
  Future<bool> _confirmDuplicateNameIfAny() async {
    final trimmedName = _data.name.trim().toLowerCase();
    final isDuplicate = widget.controller.allItems
        .any((s) => s.name.trim().toLowerCase() == trimmedName);
    if (!isDuplicate) return true;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Aynı isimde abonelik mevcut'),
        content: Text(
          '"${_data.name.trim()}" adında zaten bir abonelik var. '
          'Yine de eklemek istiyor musunuz?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Vazgeç'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Yine de ekle'),
          ),
        ],
      ),
    );
    return confirmed ?? false;
  }

  /// Test 37: kullanıcı yaklaşan yenileme tarihi olan bir abonelik eklerken,
  /// bildirim izni kapalıysa hatırlatma alamayacağını PROAKTİF olarak
  /// (ayarlara gitmeden, kendisi fark etmeden) öğrenmeli.
  Future<void> _warnIfNotificationsDisabled() async {
    final granted = await _notifications.arePermissionsGranted();
    if (granted || !mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text(
          'Bildirim izni kapalı — bu abonelik için hatırlatma alamayacaksın.',
        ),
        action: SnackBarAction(
          label: 'Aç',
          onPressed: () => context.push(AppRoutes.notificationSettings),
        ),
        duration: const Duration(seconds: 6),
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (!await _confirmDuplicateNameIfAny()) return;
    if (!mounted) return;

    final amount = Money.parse(_data.amount);

    final ok = await _submitData(amount);

    if (!mounted) return;
    if (!ok) {
      showFormSaveError(context, widget.controller);
      return;
    }
    if (_data.initialPaymentStatus == InitialPaymentStatus.paid) {
      await _recordInitialPayment(amount);
      if (!mounted) return;
    }
    await _warnIfNotificationsDisabled();
    if (!mounted) return;
    Navigator.pop(context);
  }

  Future<bool> _submitData(Money amount) {
    return widget.controller.add(
      name: _data.name,
      amount: amount,
      currency: _data.currency,
      billingCycle: _data.billingCycle,
      startDate: _data.startDate,
      nextRenewalDate: _data.nextRenewalDate,
      category: _data.category,
      notes: _data.notesOrNull,
      paymentMethod: _data.paymentMethod,
      trialEndDate: _data.trialEndOrNull,
      trialPriceAfter: _data.trialPriceOrNull,
      notificationRules: _data.notificationRules,
    );
  }

  Future<void> _recordInitialPayment(Money amount) {
    // lastWhere: aynı isimde birden fazla abonelik varsa (Test 7),
    // yeni oluşturulan kayıt listenin SONUNA eklenir (bkz.
    // SubscriptionController.add → _items.add(sub)) — firstWhere eski
    // bir aynı-isimli kayda yanlışlıkla ödeme kaydı ekleyebilirdi.
    final created = widget.controller.allItems.lastWhere(
      (s) => s.name == _data.name,
    );
    return widget.controller.recordPayment(
      subscriptionId: created.id,
      amount: amount,
      currency: _data.currency,
      paidAt: _data.initialPaymentDate,
    );
  }

  @override
  Widget build(BuildContext context) {
    return SubscriptionFormScaffold(
      title: 'Yeni abonelik',
      actionLabel: 'Aboneliği kaydet',
      controller: widget.controller,
      formKey: _formKey,
      data: _data,
      settings: _preferences,
      onSave: _save,
    );
  }
}
