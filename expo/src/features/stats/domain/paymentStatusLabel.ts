import type { PaymentEvent } from './paymentEvents';

/** Ödeme satırında gösterilen durum: ertelenmiş kayıt "Ertelendi", diğerleri "Ödendi". */
export function paymentStatusLabel(status: PaymentEvent['status']): string {
  return status === 'DEFERRED' ? 'Ertelendi' : 'Ödendi';
}
