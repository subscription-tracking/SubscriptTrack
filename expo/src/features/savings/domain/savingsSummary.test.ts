import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Money } from '../../../core/domain/money';
import { savingsDraftFor, savingsEventTitle, savingsTotalsByCurrency, topCostSentence } from './savingsSummary';
import { subscriptionFromRow, type SubscriptionRow } from '../../subscriptions/domain/subscription';

const savingsGoldens = (JSON.parse(
  readFileSync(resolve(process.cwd(), '../testdata/flutter_expo_domain_goldens.json'), 'utf8'),
) as {
  savings: {
    amount: string;
    billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    currency: string;
    monthly: string;
    annual: string;
  }[];
}).savings;

const row = (golden: (typeof savingsGoldens)[number]): SubscriptionRow => ({
  id: 'golden-subscription',
  name: 'Golden subscription',
  amount: golden.amount,
  currency: golden.currency,
  billing_cycle: golden.billingCycle,
  category: 'other',
  status: 'active',
  start_date: '2026-01-31',
  next_renewal_date: '2026-10-31',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
});

describe('Ortak Flutter–Expo tasarruf altın senaryoları', () => {
  it.each(savingsGoldens)('$billingCycle $amount $currency aylık/yıllık eşdeğeri', (golden) => {
    const subscription = subscriptionFromRow(row(golden));
    for (const eventType of ['PAUSED', 'CANCELLED'] as const) {
      const draft = savingsDraftFor(subscription, eventType);
      expect(draft).toEqual({
        eventType,
        monthlyAmount: golden.monthly,
        annualAmount: golden.annual,
        currency: golden.currency,
      });
    }
  });

  it('tasarruf geçmişini para birimi bazında toplar, farklı para birimlerini karıştırmaz', () => {
    const totals = savingsTotalsByCurrency(savingsGoldens.map((golden) => ({
      subscriptionId: null,
      eventType: 'CANCELLED',
      annual: Money.parse(golden.annual),
      currency: golden.currency,
      effectiveAt: '2026-10-11T00:00:00.000Z',
    })));
    expect([...totals].map(([currency, amount]) => [currency, amount.decimalString])).toEqual([
      ['USD', '0.48'],
      ['TRY', '1200.00'],
      ['EUR', '39.96'],
      ['GBP', '120.00'],
    ]);
  });
});

describe('savingsEventTitle ve topCostSentence', () => {
  it('tarih varsa ekler, yoksa yazmaz', () => {
    expect(savingsEventTitle('CANCELLED', '10 Ekim 2026')).toBe('İptal edildi · 10 Ekim 2026');
    expect(savingsEventTitle('PAUSED', '10 Ekim 2026')).toBe('Duraklatıldı · 10 Ekim 2026');
    expect(savingsEventTitle('PAUSED', null)).toBe('Duraklatıldı');
  });

  it('özet cümlesi tarafsız ve birimlidir', () => {
    expect(topCostSentence(3, '₺1.080,00')).toBe('İlk 3 abonelik yılda ₺1.080,00 tutuyor.');
    expect(topCostSentence(1, '₺120,00')).toBe('Bu abonelik yılda ₺120,00 tutuyor.');
  });
});
