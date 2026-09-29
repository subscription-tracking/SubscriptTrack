// CSV alan yardımcıları (Edge Function'lar ve Node testleri ortak kullanır).
//
// CSV injection: Excel/LibreOffice/Sheets, `=`, `+`, `-`, `@`, sekme veya satır
// başı ile başlayan hücreleri formül olarak çalıştırabilir. Kullanıcı
// tarafından girilen metin alanları bu yüzden başına `'` eklenerek
// etkisizleştirilir (OWASP önerisi). Sayısal/tarih sütunları etkilenmez.

export const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r']

/** Formül olarak yorumlanabilecek metnin başına `'` ekler. */
export function neutralizeFormula(value) {
  const text = String(value ?? '')
  return text.length > 0 && FORMULA_TRIGGERS.includes(text[0]) ? `'${text}` : text
}

/**
 * Tek bir CSV alanını çift tırnakla sarar.
 * @param {unknown} value
 * @param {{ text?: boolean }} [options] `text: false` sayısal/tarih sütunları
 *   için formül koruması uygulamaz.
 */
export function csvField(value, { text = true } = {}) {
  const raw = String(value ?? '')
  const safe = text ? neutralizeFormula(raw) : raw
  return `"${safe.replaceAll('"', '""')}"`
}
