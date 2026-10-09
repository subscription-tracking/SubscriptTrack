import { readJson, writeJson } from '../../../core/storage/secureJsonStore';

/**
 * Seçilen para birimi sembolü (Flutter `SettingsController.setCurrency` ile aynı). Yalnızca cihazda
 * tutulur; profil tablosuna yazılmaz. Varsayılan Flutter ile aynı: "₺".
 */

const KEY = 'settings.currency';
export const DEFAULT_CURRENCY_SYMBOL = '₺';

export async function readCurrencySymbol(): Promise<string> {
  const value = await readJson(KEY);
  return typeof value === 'string' && value.length > 0 ? value : DEFAULT_CURRENCY_SYMBOL;
}

export async function writeCurrencySymbol(symbol: string): Promise<void> {
  await writeJson(KEY, symbol);
}
