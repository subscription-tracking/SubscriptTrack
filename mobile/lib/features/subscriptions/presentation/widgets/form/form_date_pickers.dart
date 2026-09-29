import 'package:flutter/material.dart';

import '../subscription_form_data.dart';

String formatFormDate(DateTime d) => '${d.day}/${d.month}/${d.year}';

/// Form tarih seçicileri. Her yöntem seçim yapıldıysa `true` döner ve
/// [SubscriptionFormData]'yı günceller; çağıran State yeniden çizdirir.
abstract final class FormDatePickers {
  static DateTime _in(int days) => DateTime.now().add(Duration(days: days));

  static Future<bool> startDate(
      BuildContext context, SubscriptionFormData data) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: data.startDate,
      firstDate: DateTime(2000),
      lastDate: _in(365),
    );
    if (picked == null) return false;
    data.startDate = picked;
    // Başlangıç bugün/gelecekteyse ilk yenileme == başlangıç; geçmişteyse
    // kaçırılan periyotlar atlanıp bugünden sonraki en yakın yenilemeye
    // ulaşılır (bkz. DateTimeUtils.nextOccurrenceOnOrAfter).
    data.recalculateNextRenewal();
    return true;
  }

  static Future<bool> nextRenewal(
      BuildContext context, SubscriptionFormData data) async {
    final earliest = data.startDate.isAfter(DateTime.now())
        ? data.startDate
        : DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: data.nextRenewalDate.isBefore(earliest)
          ? earliest
          : data.nextRenewalDate,
      firstDate: earliest,
      lastDate: _in(365 * 3),
    );
    if (picked == null) return false;
    data.nextRenewalDate = picked;
    return true;
  }

  static Future<bool> initialPayment(
      BuildContext context, SubscriptionFormData data) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: data.initialPaymentDate,
      firstDate: data.startDate,
      lastDate: _in(365 * 3),
    );
    if (picked == null) return false;
    data.initialPaymentDate = picked;
    return true;
  }

  static Future<bool> deferredPayment(
      BuildContext context, SubscriptionFormData data) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: data.deferredPaymentDate ?? data.nextRenewalDate,
      firstDate: DateTime.now(),
      lastDate: _in(365 * 3),
    );
    if (picked == null) return false;
    data.deferredPaymentDate = picked;
    return true;
  }

  static Future<bool> trialEnd(
      BuildContext context, SubscriptionFormData data) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: data.trialEndDate ?? data.nextRenewalDate,
      firstDate: data.startDate,
      lastDate: _in(365 * 3),
    );
    if (picked == null) return false;
    data.trialEndDate = picked;
    return true;
  }
}
