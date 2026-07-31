class DateTimeUtils {
  DateTimeUtils._();

  static String formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = date.difference(now).inDays;
    if (diff == 0) return 'Bugün';
    if (diff == 1) return 'Yarın';
    if (diff < 0) return 'Geçti';
    return '${date.day} ${_monthName(date.month)} ${date.year}';
  }

  static String formatCurrency(double amount, {String symbol = '₺'}) {
    final formatted = amount.toStringAsFixed(2).replaceAll('.', ',');
    return '$symbol$formatted';
  }

  static String _monthName(int month) => const [
        '', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
        'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
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
