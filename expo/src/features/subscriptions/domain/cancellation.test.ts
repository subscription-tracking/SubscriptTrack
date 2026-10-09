import { civilDate } from '../../../core/time/calendar';
import { statusChangeEvent } from './subscriptionEdit';
import {
  cancellationPayload,
  hasCancellationErrors,
  providerCancelUrl,
  validateCancellation,
} from './cancellation';

const today = civilDate(2026, 10, 9);
const format = (day: { year: number; month: number; day: number }) =>
  `${day.year}-${String(day.month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;

describe('validateCancellation', () => {
  it('bugünkü veya geçmiş iptal tarihi geçerlidir', () => {
    expect(hasCancellationErrors(validateCancellation({ cancelledOn: today, accessEndsOn: null }, today))).toBe(false);
    expect(hasCancellationErrors(validateCancellation({ cancelledOn: civilDate(2026, 10, 1), accessEndsOn: null }, today))).toBe(false);
  });

  it('gelecek iptal tarihi reddedilir', () => {
    const errors = validateCancellation({ cancelledOn: civilDate(2026, 10, 10), accessEndsOn: null }, today);
    expect(errors.cancelledOn).toBeDefined();
  });

  it('erişim bitişi iptal tarihinden önce olamaz; aynı gün veya sonrası geçerli', () => {
    const cancelledOn = civilDate(2026, 10, 5);
    expect(validateCancellation({ cancelledOn, accessEndsOn: civilDate(2026, 10, 4) }, today).accessEndsOn).toBeDefined();
    expect(hasCancellationErrors(validateCancellation({ cancelledOn, accessEndsOn: civilDate(2026, 10, 5) }, today))).toBe(false);
    expect(hasCancellationErrors(validateCancellation({ cancelledOn, accessEndsOn: civilDate(2026, 11, 5) }, today))).toBe(false);
  });
});

describe('cancellationPayload', () => {
  it('erişim bitişi yoksa yalnızca iptal tarihini yazar', () => {
    expect(cancellationPayload({ cancelledOn: civilDate(2026, 10, 9), accessEndsOn: null }, format)).toEqual({
      cancelled_on: '2026-10-09',
    });
  });

  it('erişim bitişi varsa onu da yazar', () => {
    expect(cancellationPayload({ cancelledOn: civilDate(2026, 10, 9), accessEndsOn: civilDate(2026, 10, 31) }, format)).toEqual({
      cancelled_on: '2026-10-09',
      access_ends_on: '2026-10-31',
    });
  });

  it('iptal olayına payload olarak eklenir', () => {
    const draft = statusChangeEvent('active', 'cancelled', { cancelled_on: '2026-10-09' });
    expect(draft?.payload).toEqual({ from_status: 'active', to_status: 'cancelled', cancelled_on: '2026-10-09' });
  });
});

describe('providerCancelUrl', () => {
  it('web sitesi yoksa null', () => {
    expect(providerCancelUrl(null)).toBeNull();
    expect(providerCancelUrl('   ')).toBeNull();
  });

  it('şemasız adrese https ekler', () => {
    expect(providerCancelUrl('netflix.com/cancel')).toBe('https://netflix.com/cancel');
  });

  it('http ve https adreslerini korur', () => {
    expect(providerCancelUrl('https://spotify.com/account')).toBe('https://spotify.com/account');
  });

  it('http(s) dışındaki şemaları reddeder', () => {
    expect(providerCancelUrl('javascript:alert(1)')).toBeNull();
    expect(providerCancelUrl('file:///etc/passwd')).toBeNull();
  });
});
