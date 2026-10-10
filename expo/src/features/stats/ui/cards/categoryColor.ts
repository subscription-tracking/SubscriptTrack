import { categoryPalette } from '../../../../shared/design/palette';
import { SUBSCRIPTION_CATEGORIES, type SubscriptionCategory } from '../../../subscriptions/domain/subscription';

/**
 * Kategorinin sabit rengi: `SUBSCRIPTION_CATEGORIES` içindeki yerine göre. Liste sıralaması ya da tutar
 * değişince renk değişmez. Renk tokenları sunum katmanında kaldığı için bu dosya domain'e değil UI'a aittir.
 */
export function categoryColor(category: SubscriptionCategory): string {
  const index = SUBSCRIPTION_CATEGORIES.indexOf(category);
  return categoryPalette[index] ?? categoryPalette[categoryPalette.length - 1];
}
