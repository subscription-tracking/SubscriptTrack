/**
 * Hesap silme onayı ([USER_FLOWS §17](../../../../../docs/product/USER_FLOWS.md), Flutter ile aynı):
 * parola, "sil" yazma ve açık onay kutusu birlikte gerekir. Silme geri alınamaz. I/O yoktur.
 */

export const CONFIRM_WORD = 'sil';

export interface DeleteAccountInput {
  password: string;
  confirmation: string;
  acknowledged: boolean;
}

export interface DeleteAccountErrors {
  password?: string;
  confirmation?: string;
  acknowledged?: string;
}

export function validateDeleteAccount(input: DeleteAccountInput): DeleteAccountErrors {
  const errors: DeleteAccountErrors = {};
  if (!input.password) errors.password = 'Devam etmek için şifreni gir';
  if (input.confirmation.trim().toLocaleLowerCase('tr-TR') !== CONFIRM_WORD) {
    errors.confirmation = `Onaylamak için "${CONFIRM_WORD}" yaz`;
  }
  if (!input.acknowledged) errors.acknowledged = 'Silinecek verileri anladığını onayla';
  return errors;
}

export function hasDeleteErrors(errors: DeleteAccountErrors): boolean {
  return Object.values(errors).some(Boolean);
}
