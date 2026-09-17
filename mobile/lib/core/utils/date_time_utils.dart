class DateTimeUtils {
  DateTimeUtils._();

  /// Adds [months] to [date], clamping the day to the target month's last
  /// day instead of overflowing into the following month.
  ///
  /// `DateTime(year, month + 1, day)` does not clamp: 31 Ocak + 1 ay would
  /// otherwise normalize to 2/3 Mart instead of 28/29 Şubat. This is the
  /// fix for that overflow.
  static DateTime addMonthsClamped(DateTime date, int months) {
    final totalMonths = date.month - 1 + months;
    final year = date.year + totalMonths ~/ 12;
    final month = totalMonths % 12 + 1;
    final daysInMonth = DateTime(year, month + 1, 0).day;
    final day = date.day > daysInMonth ? daysInMonth : date.day;
    return DateTime(year, month, day);
  }

  /// Advances [anchor] by one billing [cycle], using [addMonthsClamped] for
  /// month-based cycles so day-of-month overflow never occurs.
  static DateTime _advanceOnce(DateTime anchor, String cycleKey) => switch (cycleKey) {
        'weekly' => anchor.add(const Duration(days: 7)),
        'quarterly' => addMonthsClamped(anchor, 3),
        'yearly' => addMonthsClamped(anchor, 12),
        _ => addMonthsClamped(anchor, 1), // monthly (default)
      };

  /// Returns the first occurrence of [anchor] + N·[cycle] that falls on or
  /// after [reference] (both compared by calendar day).
  ///
  /// - If [anchor] is already on/after [reference] (e.g. a subscription that
  ///   hasn't started yet), it is returned unchanged — the first billing
  ///   event IS the anchor date itself.
  /// - If [anchor] is in the past, elapsed cycles are skipped until landing
  ///   on the next upcoming occurrence — no manual "how many periods have
  ///   passed" math needed by the caller, and no stale past date lingers.
  ///
  /// [cycleKey] is `BillingCycle.key` (avoids a domain-layer import here).
  static DateTime nextOccurrenceOnOrAfter(
    DateTime anchor,
    String cycleKey,
    DateTime reference,
  ) {
    final refDay = DateTime(reference.year, reference.month, reference.day);
    var current = anchor;
    var currentDay = DateTime(current.year, current.month, current.day);
    while (currentDay.isBefore(refDay)) {
      current = _advanceOnce(current, cycleKey);
      currentDay = DateTime(current.year, current.month, current.day);
    }
    return current;
  }

  static String formatDate(DateTime date) {
    final now = DateTime.now();
    // Compare calendar days, not hours, to avoid late-night inDays=0 edge case.
    final today = DateTime(now.year, now.month, now.day);
    final target = DateTime(date.year, date.month, date.day);
    final diff = target.difference(today).inDays;
    if (diff == 0) return 'Bugün';
    if (diff == 1) return 'Yarın';
    if (diff < 0) return 'Geçti';
    return '${date.day} ${_monthName(date.month)} ${date.year}';
  }

  static const _isoToSymbol = {
    'TRY': '₺',
    'USD': '\$',
    'EUR': '€',
    'GBP': '£',
  };

  static String formatCurrency(double amount, {String symbol = '₺'}) {
    final displaySymbol = _isoToSymbol[symbol] ?? symbol;
    final fixed = amount.toStringAsFixed(2);
    final parts = fixed.split('.');
    final integer = parts.first;
    final grouped = integer.replaceAllMapped(
      RegExp(r'(?<=\d)(?=(\d{3})+(?!\d))'),
      (_) => '.',
    );
    final formatted = '$grouped,${parts.last}';
    return '$displaySymbol$formatted';
  }

  static String _monthName(int month) => const [
        '',
        'Oca',
        'Şub',
        'Mar',
        'Nis',
        'May',
        'Haz',
        'Tem',
        'Ağu',
        'Eyl',
        'Eki',
        'Kas',
        'Ara'
      ][month];

  static String renewalLabel(int days) {
    if (days < 0) return 'Süresi doldu';
    if (days == 0) return 'Bugün yenileniyor';
    if (days == 1) return 'Yarın yenileniyor';
    if (days <= 7) return '$days gün sonra';
    if (days <= 30) return '${(days / 7).round()} hafta sonra';
    return '${(days / 30).round()} ay sonra';
  }
}
