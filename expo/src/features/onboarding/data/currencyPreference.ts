import { readJson, writeJson } from '../../../core/storage/secureJsonStore';
import { isActiveCurrency, type ActiveCurrency } from '../../../core/domain/activeCurrency';

/**
 * Cihazdaki son para birimi seçimi (aktif para birimi). Profil tercihi yoksa (ör. giriş öncesi tanıtım) bu
 * değer kullanılır. Yalnızca desteklenen kodlar okunur; eski sembol değerleri yok sayılır.
 */

const KEY = 'settings.currencyCode';

export async function readDeviceCurrency(): Promise<ActiveCurrency | null> {
  const value = await readJson(KEY);
  return isActiveCurrency(typeof value === 'string' ? value : null) ? (value as ActiveCurrency) : null;
}

export async function writeDeviceCurrency(currency: ActiveCurrency): Promise<void> {
  await writeJson(KEY, currency);
}
