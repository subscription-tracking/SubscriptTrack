import { type CivilDate, dayNumber } from '../../../core/time/calendar';

/**
 * İptal akışı kuralları ([USER_FLOWS §9](../../../../../docs/product/USER_FLOWS.md)).
 * "İptal ettim" seçeneğinde iptal tarihi zorunlu, erişim bitişi isteğe bağlıdır. Erişim bitişi
 * kolonu veritabanında yoktur ([DOMAIN §4](../../../../../docs/product/DOMAIN.md)); bu yüzden
 * tarihler `STATUS_CHANGED` olayının payload'ında saklanır. I/O yoktur.
 */

export interface CancellationValues {
  cancelledOn: CivilDate;
  accessEndsOn: CivilDate | null;
}

export interface CancellationErrors {
  cancelledOn?: string;
  accessEndsOn?: string;
}

export function validateCancellation(values: CancellationValues, today: CivilDate): CancellationErrors {
  const errors: CancellationErrors = {};
  if (dayNumber(values.cancelledOn) > dayNumber(today)) {
    errors.cancelledOn = 'İptal tarihi bugünden sonra olamaz';
  }
  if (values.accessEndsOn && dayNumber(values.accessEndsOn) < dayNumber(values.cancelledOn)) {
    errors.accessEndsOn = 'Erişim bitişi iptal tarihinden önce olamaz';
  }
  return errors;
}

export function hasCancellationErrors(errors: CancellationErrors): boolean {
  return Object.values(errors).some(Boolean);
}

/** Olay payload'ı için iptal tarihleri (ISO gün biçiminde). */
export function cancellationPayload(values: CancellationValues, format: (day: CivilDate) => string): Record<string, string> {
  const payload: Record<string, string> = { cancelled_on: format(values.cancelledOn) };
  if (values.accessEndsOn) payload.access_ends_on = format(values.accessEndsOn);
  return payload;
}

/**
 * Sağlayıcının iptal sayfası için bağlantı. Kayıtlı web sitesi yoksa veya şeması http(s) değilse null.
 * Eksik şema https kabul edilir.
 */
export function providerCancelUrl(website: string | null): string | null {
  const trimmed = website?.trim();
  if (!trimmed) return null;
  const hasHttpScheme = /^https?:\/\//i.test(trimmed);
  // Başka bir şema (javascript:, file:, …) varsa şemasız sayılıp düzeltilmez; reddedilir.
  if (!hasHttpScheme && /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;
  const candidate = hasHttpScheme ? trimmed : `https://${trimmed}`;
  return /^https?:\/\/[^\s/]+[^\s]*$/i.test(candidate) ? candidate : null;
}
