class DateTimeUtils {
  DateTimeUtils._();

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
