/**
 * Profil kuralları. Ad ve soyad en fazla 60 karakter; tercih edilen para birimi desteklenen listeden.
 * Veritabanındaki `profiles` alanlarıyla eşleşir ([DATA_MODEL §2.7](../../../../../docs/reference/DATA_MODEL.md)). I/O yoktur.
 */

export const NAME_MAX_LENGTH = 60;
export const PREFERRED_CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP'] as const;
export type PreferredCurrency = (typeof PREFERRED_CURRENCIES)[number];

export interface ProfileValues {
  firstName: string;
  lastName: string;
  preferredCurrency: PreferredCurrency;
}

export interface ProfileErrors {
  firstName?: string;
  lastName?: string;
}

export function validateProfile(values: ProfileValues): ProfileErrors {
  const errors: ProfileErrors = {};
  if (values.firstName.trim().length > NAME_MAX_LENGTH) errors.firstName = `Ad en fazla ${NAME_MAX_LENGTH} karakter olabilir`;
  if (values.lastName.trim().length > NAME_MAX_LENGTH) errors.lastName = `Soyad en fazla ${NAME_MAX_LENGTH} karakter olabilir`;
  return errors;
}

export function isPreferredCurrency(value: string): value is PreferredCurrency {
  return (PREFERRED_CURRENCIES as readonly string[]).includes(value);
}
