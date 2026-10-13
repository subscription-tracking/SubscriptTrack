import { collapseDuplicates } from './notificationGroups';

const item = (id: string, subscriptionId: string | null, kind: string, createdAt: string) => ({ id, subscriptionId, kind, createdAt });

describe('collapseDuplicates', () => {
  it('aynı abonelik ve türdeki tekrarları toplar, en yeni kaydı temsilci yapar', () => {
    const result = collapseDuplicates([
      item('a', 's1', 'renewal_soon', '2026-10-10T07:00:00Z'),
      item('b', 's1', 'renewal_soon', '2026-10-10T09:00:00Z'),
      item('c', 's1', 'renewal_today', '2026-10-13T06:00:00Z'),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].count).toBe(2);
    expect(result[0].ids).toEqual(['a', 'b']);
    expect(result[0].item.id).toBe('b');
    expect(result[1].count).toBe(1);
  });

  it('farklı abonelikleri ayrı tutar ve ilk görülme sırasını korur', () => {
    const result = collapseDuplicates([
      item('a', 's1', 'renewal_soon', '2026-10-10T07:00:00Z'),
      item('b', 's2', 'renewal_soon', '2026-10-10T08:00:00Z'),
    ]);
    expect(result.map((entry) => entry.item.id)).toEqual(['a', 'b']);
  });

  it('abonelik kimliği olmayan kayıtları toplamaz', () => {
    const result = collapseDuplicates([
      item('a', null, 'renewal_soon', '2026-10-10T07:00:00Z'),
      item('b', null, 'renewal_soon', '2026-10-10T08:00:00Z'),
    ]);
    expect(result).toHaveLength(2);
  });

  it('boş girdide boş döner', () => {
    expect(collapseDuplicates([])).toEqual([]);
  });
});
