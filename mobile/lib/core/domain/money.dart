/// Represents money in integer minor units (for example cents or kurus).
class Money {
  const Money._internal(this._minorUnits);

  static const zero = Money._internal(0);

  factory Money.parse(String input) {
    final normalized = input.trim().replaceAll(',', '.');
    final match = RegExp(r'^(-?)(\d+)(?:\.(\d{0,2}))?$').firstMatch(normalized);
    if (match == null) return Money.zero;
    final whole = int.tryParse(match.group(2)!) ?? 0;
    final fraction = (match.group(3) ?? '').padRight(2, '0');
    final minor = whole * 100 + (int.tryParse(fraction) ?? 0);
    return Money._internal(match.group(1) == '-' ? -minor : minor);
  }

  factory Money.fromJson(dynamic json) {
    if (json is String) return Money.parse(json);
    // Backwards compatibility for old numeric local-cache values.
    if (json is num) return Money.parse(json.toString());
    return Money.zero;
  }

  final int _minorUnits;

  /// Display-only convenience value. Do not use for persistence or API math.
  double get amount => _minorUnits / 100;
  int get minorUnits => _minorUnits;

  /// Exact decimal wire representation for JSON and database boundaries.
  String get decimalString {
    final sign = _minorUnits < 0 ? '-' : '';
    final absolute = _minorUnits.abs();
    return '$sign${absolute ~/ 100}.${(absolute % 100).toString().padLeft(2, '0')}';
  }

  String toJson() => decimalString;

  Money operator +(Money other) =>
      Money._internal(_minorUnits + other._minorUnits);
  Money operator -(Money other) =>
      Money._internal(_minorUnits - other._minorUnits);
  Money operator *(num factor) =>
      Money._internal((_minorUnits * factor).round());
  Money operator /(num divisor) =>
      Money._internal((_minorUnits / divisor).round());
  int compareTo(Money other) => _minorUnits.compareTo(other._minorUnits);

  @override
  bool operator ==(Object other) =>
      other is Money && other._minorUnits == _minorUnits;

  @override
  int get hashCode => _minorUnits.hashCode;

  @override
  String toString() => 'Money($decimalString)';
}
