import 'package:flutter/material.dart';

import '../../../../core/domain/money.dart';
import '../../../../core/services/local_notification_service.dart';
import '../../../settings/presentation/screens/notification_preferences_screen.dart';
import '../../../settings/presentation/settings_controller.dart';
import '../subscription_controller.dart';
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
  late final _data = SubscriptionFormData(startDate: widget.initialStartDate);

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
    final granted = await LocalNotificationService.arePermissionsGranted();
    if (granted || !mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text(
          'Bildirim izni kapalı — bu abonelik için hatırlatma alamayacaksın.',
        ),
        action: SnackBarAction(
          label: 'Aç',
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute<void>(
              builder: (_) => NotificationPreferencesScreen(
                controller: SettingsController.instance,
              ),
            ),
          ),
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

    final ok = await widget.controller.add(
      name: _data.name,
      amount: amount,
      currency: _data.currency,
      billingCycle: _data.billingCycle,
      startDate: _data.startDate,
      nextRenewalDate: _data.nextRenewalDate,
      category: _data.category,
      notes: _data.notes.trim().isEmpty ? null : _data.notes.trim(),
      paymentMethod: _data.paymentMethod,
      trialEndDate: _data.isTrial ? _data.trialEndDate : null,
      trialPriceAfter:
          _data.isTrial ? Money.parse(_data.trialPriceAfter) : null,
      notificationRules: _data.notificationRules,
    );

    if (!mounted) return;
    if (ok) {
      if (_data.initialPaymentStatus == InitialPaymentStatus.paid) {
        // lastWhere: aynı isimde birden fazla abonelik varsa (Test 7),
        // yeni oluşturulan kayıt listenin SONUNA eklenir (bkz.
        // SubscriptionController.add → _items.add(sub)) — firstWhere eski
        // bir aynı-isimli kayda yanlışlıkla ödeme kaydı ekleyebilirdi.
        final created = widget.controller.allItems.lastWhere(
          (s) => s.name == _data.name,
        );
        await widget.controller.recordPayment(
          subscriptionId: created.id,
          amount: amount.amount,
          currency: _data.currency,
          paidAt: _data.initialPaymentDate,
        );
        if (!mounted) return;
      }
      await _warnIfNotificationsDisabled();
      if (!mounted) return;
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
