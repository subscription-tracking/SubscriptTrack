import { Money } from '../../../core/domain/money';
import { ACTIVE_CURRENCIES } from '../../../core/domain/activeCurrency';
import { type BillingCycle, type CivilDate, formatCivilDate } from '../../../core/time/calendar';
import { SUBSCRIPTION_LIMITS, annualAmount, monthlyAmount, type SubscriptionCategory } from './subscription';

/**
 * Abonelik formu: doğrulama ve RPC yükü. Flutter `SubscriptionFormValidators` ve
 * `create_subscription_idempotent` sözleşmesiyle aynıdır ([API.md §4](../../../../../docs/reference/API.md)).
 * Saf fonksiyonlar; I/O yoktur.
 */

/** Form para birimleri: uygulamanın üç aktif para birimi (`core/domain/activeCurrency`). */
export const FORM_CURRENCIES = ACTIVE_CURRENCIES;
export type FormCurrency = (typeof FORM_CURRENCIES)[number];

export const FORM_BILLING_CYCLES: readonly BillingCycle[] = ['weekly', 'monthly', 'quarterly', 'yearly'];

export type InitialPaymentStatus = 'paid' | 'unpaid' | 'deferred';

export interface SubscriptionFormValues {
  name: string;
  amount: string;
  /** Listede olmayan bir para birimi (eski kayıt) da düzenlemede korunur; bu yüzden string. */
  currency: string;
  billingCycle: BillingCycle;
  category: SubscriptionCategory;
  startDate: CivilDate;
  nextRenewalDate: CivilDate | null;
  notes: string;
  paymentMethod: string;
  isTrial: boolean;
  trialEndDate: CivilDate | null;
  trialPrice: string;
  /** Yalnızca ekleme formu: ilk ödeme durumu. "paid" ödeme kaydı yazar; "deferred" ertelenmiş kayıt yazar. */
  initialPaymentStatus: InitialPaymentStatus;
  initialPaymentDate: CivilDate;
  /** Hatırlatma günleri (0/1/3/7 çipleri); en az bir gün. Kayıt `notification_rules` olarak yazılır. */
  reminderDays: number[];
}

export type FormErrors = Partial<
  Record<'name' | 'amount' | 'nextRenewalDate' | 'trialEndDate' | 'trialPrice' | 'notes' | 'paymentMethod' | 'reminderDays', string>
>;

/** Veritabanı CHECK sınırları ([DATA_MODEL §2.9.1](../../../../../docs/reference/DATA_MODEL.md)). */
export const LIMITS = {
  nameMax: 160,
  amountMaxMinorUnits: SUBSCRIPTION_LIMITS.amountMaxMinorUnits,
  notesMax: 2000,
  paymentMethodMax: 80,
} as const;

/** Tutar metnini Money'e çevirir; geçersiz ya da sıfır/negatif ise null. */
function positiveMoney(value: string): Money | null {
  const money = Money.tryParse(value.trim());
  if (!money || money.compareTo(Money.zero) <= 0) return null;
  return money;
}

export function validateSubscriptionForm(values: SubscriptionFormValues): FormErrors {
  const errors: FormErrors = {};

  const name = values.name.trim();
  if (!name) errors.name = 'Ad boş olamaz';
  else if (name.length > LIMITS.nameMax) errors.name = `Ad en fazla ${LIMITS.nameMax} karakter olabilir`;

  if (!values.amount.trim()) {
    errors.amount = 'Tutar gir';
  } else {
    const money = positiveMoney(values.amount);
    if (!money) errors.amount = 'Geçerli tutar gir';
    else if (money.minorUnits > LIMITS.amountMaxMinorUnits) errors.amount = 'Tutar çok yüksek';
  }

  if (!values.nextRenewalDate) errors.nextRenewalDate = 'Yenileme tarihini seç';

  if (values.isTrial) {
    if (!values.trialEndDate) errors.trialEndDate = 'Deneme bitiş tarihini seç';
    if (!positiveMoney(values.trialPrice)) errors.trialPrice = 'Geçerli bir deneme sonrası fiyatı gir';
  }

  if (values.reminderDays.length === 0) errors.reminderDays = 'En az bir hatırlatma seç';
  if (values.notes.length > LIMITS.notesMax) errors.notes = `Not en fazla ${LIMITS.notesMax} karakter olabilir`;
  if (values.paymentMethod.trim().length > LIMITS.paymentMethodMax) {
    errors.paymentMethod = `Ödeme yöntemi en fazla ${LIMITS.paymentMethodMax} karakter olabilir`;
  }
  return errors;
}

export function hasErrors(errors: FormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

/** `create_subscription_idempotent` parametreleri (p_* adları sözleşmeyle aynıdır). */
export interface CreateSubscriptionPayload {
  p_idempotency_key: string;
  p_name: string;
  p_amount: string;
  p_currency: string;
  p_billing_cycle: BillingCycle;
  p_start_date: string;
  p_next_renewal_date: string;
  p_category: SubscriptionCategory;
  p_notes: string | null;
  p_payment_method: string | null;
  p_trial_end_date: string | null;
  p_trial_price_after: string | null;
}

/** Ekleme ve düzenleme RPC'lerinde ortak alanlar (idempotency anahtarı hariç). */
export type SubscriptionFields = Omit<CreateSubscriptionPayload, 'p_idempotency_key'>;

/** Doğrulanmış formu RPC alanlarına çevirir. Doğrulama önce çağrılmalıdır. */
export function toSubscriptionFields(values: SubscriptionFormValues): SubscriptionFields {
  const amount = positiveMoney(values.amount);
  const trialPrice = values.isTrial ? positiveMoney(values.trialPrice) : null;
  if (!amount || amount.minorUnits > LIMITS.amountMaxMinorUnits || !values.nextRenewalDate) {
    throw new RangeError('Form doğrulanmadan yük üretilemez');
  }

  return {
    p_name: values.name.trim(),
    p_amount: amount.decimalString,
    p_currency: values.currency,
    p_billing_cycle: values.billingCycle,
    p_start_date: formatCivilDate(values.startDate),
    p_next_renewal_date: formatCivilDate(values.nextRenewalDate),
    p_category: values.category,
    p_notes: values.notes.trim() || null,
    p_payment_method: values.paymentMethod.trim() || null,
    p_trial_end_date: values.isTrial && values.trialEndDate ? formatCivilDate(values.trialEndDate) : null,
    p_trial_price_after: trialPrice ? trialPrice.decimalString : null,
  };
}

/** Doğrulanmış formu `create_subscription_idempotent` yüküne çevirir. */
export function toCreatePayload(values: SubscriptionFormValues, idempotencyKey: string): CreateSubscriptionPayload {
  return { p_idempotency_key: idempotencyKey, ...toSubscriptionFields(values) };
}

/** Ekleme formunda girilen ad mevcut (silinmemiş) bir kayıtla eşleşiyor mu? Engel değil, bilgi uyarısıdır. */
export function hasDuplicateName(name: string, subscriptions: readonly { name: string }[]): boolean {
  const key = name.trim().toLocaleLowerCase('tr-TR');
  if (!key) return false;
  return subscriptions.some((item) => item.name.trim().toLocaleLowerCase('tr-TR') === key);
}

/** Hatalı alanlardan biri kapalı "Ayrıntılar" bölümünde mi? */
export function hasDetailsErrors(errors: FormErrors): boolean {
  return Boolean(errors.notes || errors.paymentMethod || errors.trialEndDate || errors.trialPrice);
}

/** Kaydet düğmesi üstündeki maliyet özeti için aylık ve yıllık eşdeğer; tutar geçersizse `null`. */
export interface CostPreview {
  monthly: Money;
  annual: Money;
  currency: string;
}

export function costPreview(values: Pick<SubscriptionFormValues, 'amount' | 'currency' | 'billingCycle'>): CostPreview | null {
  const amount = positiveMoney(values.amount);
  if (!amount || amount.minorUnits > LIMITS.amountMaxMinorUnits) return null;
  return {
    monthly: monthlyAmount(amount, values.billingCycle),
    annual: annualAmount(amount, values.billingCycle),
    currency: values.currency,
  };
}
