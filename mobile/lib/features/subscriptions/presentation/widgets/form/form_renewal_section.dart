import 'package:flutter/material.dart';

import '../../../../notifications/domain/notification_rule.dart';
import '../form_date_tile.dart';
import '../form_section.dart';
import '../subscription_form_data.dart';
import 'form_date_pickers.dart';

// Test 33: 0 = "bugün yenileniyor" hatırlatması artık preset içinde,
// Test 32: birden fazla preset aynı anda seçilebiliyor (bkz. FilterChip).
const _reminderPresetDays = [0, 1, 3, 7];

/// Sonraki ödeme tarihi ve hatırlatma kuralı bölümü.
class FormRenewalSection extends StatelessWidget {
  const FormRenewalSection({
    required this.data,
    required this.outlineColor,
    required this.update,
    required this.onPickNextRenewal,
    super.key,
  });

  final SubscriptionFormData data;
  final Color outlineColor;
  final void Function(VoidCallback fn) update;
  final VoidCallback onPickNextRenewal;

  @override
  Widget build(BuildContext context) {
    return FormSection(
      outlineColor: outlineColor,
      children: [
        Text('Yenileme', style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 12),
        FormDateTile(
          label: 'Sonraki ödeme',
          value: formatFormDate(data.nextRenewalDate),
          onTap: onPickNextRenewal,
          outlineColor: outlineColor,
        ),
        const SizedBox(height: 16),
        Text('Hatırlat', style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _reminderPresetDays.map((days) {
            final selected =
                data.notificationRules.any((r) => r.daysBefore == days);
            return FilterChip(
              label: Text(days == 0 ? 'Bugün' : '$days gün önce'),
              selected: selected,
              showCheckmark: false,
              onSelected: (nowSelected) => update(() {
                // Test 32: her chip bağımsız olarak eklenip
                // çıkarılabiliyor — "7 gün önce" ve "1 gün önce" aynı
                // anda seçilebilir, motor (LocalNotificationService)
                // zaten birden fazla NotificationRule'ı destekliyor.
                final rules = [...data.notificationRules];
                rules.removeWhere((r) => r.daysBefore == days);
                if (nowSelected) {
                  rules.add(NotificationRule(daysBefore: days));
                }
                // En az bir hatırlatma kuralı kalmalı; sonuncuyu
                // kaldırmaya çalışan tıklama yok sayılır.
                if (rules.isNotEmpty) {
                  data.notificationRules = rules
                    ..sort((a, b) => b.daysBefore.compareTo(a.daysBefore));
                }
              }),
            );
          }).toList(),
        ),
      ],
    );
  }
}
