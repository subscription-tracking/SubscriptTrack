import { SUBSCRIPTION_CATEGORIES } from '../../../subscriptions/domain/subscription';
import { categoryColor } from './categoryColor';

describe('categoryColor', () => {
  it('her kategori için bir renk döner', () => {
    for (const category of SUBSCRIPTION_CATEGORIES) {
      expect(categoryColor(category)).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it('farklı kategoriler farklı renk alır', () => {
    const colors = SUBSCRIPTION_CATEGORIES.map((category) => categoryColor(category));
    expect(new Set(colors).size).toBe(SUBSCRIPTION_CATEGORIES.length);
  });

  it('renk kategoriye bağlıdır; çağrı sırasına bağlı değildir', () => {
    expect(categoryColor('streaming')).toBe(categoryColor('streaming'));
    expect(categoryColor('music')).not.toBe(categoryColor('streaming'));
  });
});
