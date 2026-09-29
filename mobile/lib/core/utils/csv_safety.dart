/// CSV injection koruması.
///
/// Excel/LibreOffice/Sheets, `=`, `+`, `-`, `@`, sekme veya satır başı ile
/// başlayan hücreleri formül olarak çalıştırabilir. Kullanıcı metni bu yüzden
/// başına `'` eklenerek etkisizleştirilir (OWASP önerisi); içe aktarma bu
/// eki geri alır, böylece dışa/içe aktarma gidiş-dönüşü veriyi değiştirmez.
abstract final class CsvSafety {
  static const _triggers = {'=', '+', '-', '@', '\t', '\r'};

  /// Formül olarak yorumlanabilecek metnin başına `'` ekler.
  static String neutralizeFormula(String value) =>
      value.isNotEmpty && _triggers.contains(value[0]) ? "'$value" : value;

  /// [neutralizeFormula]'nın tersi: yalnızca `'` + tetikleyici desenini çözer.
  static String restoreFormula(String value) =>
      value.length > 1 && value[0] == "'" && _triggers.contains(value[1])
          ? value.substring(1)
          : value;

  /// Tek bir CSV alanını çift tırnakla sarar. [text] `false` ise (tutar/tarih
  /// gibi sayısal sütunlar) formül koruması uygulanmaz.
  static String field(String value, {bool text = true}) {
    final safe = text ? neutralizeFormula(value) : value;
    return '"${safe.replaceAll('"', '""')}"';
  }
}
