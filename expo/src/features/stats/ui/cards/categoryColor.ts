import { categoryPalette } from '../../../../shared/design/chartTheme';
import { SUBSCRIPTION_CATEGORIES, type SubscriptionCategory } from '../../../subscriptions/domain/subscription';

/**
 * Kategorinin sabit rengi: `SUBSCRIPTION_CATEGORIES` içindeki yerine göre. Liste sıralaması ya da tutar
 * değişince renk değişmez. Renk tokenları sunum katmanında kaldığı için bu dosya domain'e değil UI'a aittir.
 */
export function categoryColor(category: SubscriptionCategory): string {
  const index = SUBSCRIPTION_CATEGORIES.indexOf(category);
  const palette = categoryPalette();
  return palette[index] ?? palette[palette.length - 1];
}
