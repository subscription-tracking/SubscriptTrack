/**
 * Ödeme yöntemleri listesi ([API.md §5 payment-methods](../../../../../docs/reference/API.md)):
 * en çok 40 ad, her biri 1–80 karakter, büyük/küçük harf duyarsız benzersiz. Kart numarası alınmaz. I/O yoktur.
 */

export const METHOD_MAX_COUNT = 40;
export const METHOD_MAX_LENGTH = 80;

export type AddMethodResult = { ok: true; methods: string[] } | { ok: false; error: string };

export function addPaymentMethod(methods: readonly string[], raw: string): AddMethodResult {
  const name = raw.trim();
  if (name.length === 0) return { ok: false, error: 'Ad boş olamaz' };
  if (name.length > METHOD_MAX_LENGTH) return { ok: false, error: `En fazla ${METHOD_MAX_LENGTH} karakter` };
  const key = name.toLocaleLowerCase('tr-TR');
  if (methods.some((method) => method.toLocaleLowerCase('tr-TR') === key)) {
    return { ok: false, error: 'Bu yöntem zaten listede' };
  }
  if (methods.length >= METHOD_MAX_COUNT) return { ok: false, error: `En fazla ${METHOD_MAX_COUNT} yöntem eklenebilir` };
  return { ok: true, methods: [...methods, name] };
}

export function removePaymentMethod(methods: readonly string[], name: string): string[] {
  return methods.filter((method) => method !== name);
}
