import { Money } from './money';
import { MoneyByCurrency, orderCurrencies } from './moneyByCurrency';

describe('orderCurrencies', () => {
  it('tercih edileni başa, sonra TRY, USD, EUR, sonra alfabetik dizer', () => {
    expect(orderCurrencies(['EUR', 'GBP', 'TRY', 'USD', 'CHF'])).toEqual(['TRY', 'USD', 'EUR', 'CHF', 'GBP']);
    expect(orderCurrencies(['EUR', 'TRY', 'USD'], 'EUR')).toEqual(['EUR', 'TRY', 'USD']);
  });

  it('listede olmayan tercih edileni de ilk sıraya koyar ve tekrarları atar', () => {
    expect(orderCurrencies(['TRY', 'TRY'], 'USD')).toEqual(['USD', 'TRY']);
  });
});

describe('MoneyByCurrency', () => {
  it('aynı para birimindeki tutarları toplar, farklı birimleri karıştırmaz', () => {
    const totals = new MoneyByCurrency().add('TRY', Money.parse('10')).add('USD', Money.parse('5')).add('TRY', Money.parse('2.5'));
    expect(totals.get('TRY').minorUnits).toBe(1250);
    expect(totals.get('USD').minorUnits).toBe(500);
    expect(totals.get('EUR').minorUnits).toBe(0);
    expect(totals.has('EUR')).toBe(false);
  });

  it('entries sıralıdır ve istenirse sıfır toplamları atlar', () => {
    const totals = new MoneyByCurrency().add('EUR', Money.parse('1')).add('TRY', Money.zero).add('USD', Money.parse('3'));
    expect(totals.entries().map((entry) => entry.currency)).toEqual(['TRY', 'USD', 'EUR']);
    expect(totals.entries('EUR').map((entry) => entry.currency)).toEqual(['EUR', 'TRY', 'USD']);
    expect(totals.entries(undefined, false).map((entry) => entry.currency)).toEqual(['USD', 'EUR']);
  });

  it('from kayıtları para birimine göre toplar ve boş tutarları atlar', () => {
    const items = [
      { currency: 'TRY', amount: Money.parse('4') },
      { currency: 'TRY', amount: Money.parse('6') },
      { currency: 'USD', amount: null },
    ];
    const totals = MoneyByCurrency.from(items, (item) => item.amount);
    expect(totals.get('TRY').minorUnits).toBe(1000);
    expect(totals.has('USD')).toBe(false);
    expect(new MoneyByCurrency().isEmpty).toBe(true);
  });
});
