import { Money } from './money';

describe('Money.parse', () => {
  it.each([
    ['10', '10.00'],
    ['10.5', '10.50'],
    ['10,5', '10.50'],
    ['0.01', '0.01'],
    ['-3.20', '-3.20'],
    ['  99.99 ', '99.99'],
  ])('%s → %s', (input, expected) => {
    expect(Money.parse(input).decimalString).toBe(expected);
  });

  it('geçersiz girdide sıfır döner', () => {
    expect(Money.parse('abc').equals(Money.zero)).toBe(true);
    expect(Money.parse('').equals(Money.zero)).toBe(true);
  });

  it('tryParse geçersiz girdide null döner', () => {
    expect(Money.tryParse('abc')).toBeNull();
    expect(Money.tryParse('1.234')).toBeNull();
  });

  it('kuruş sınırında 0,1 + 0,2 hatası üretmez', () => {
    const sum = Money.parse('0.1').add(Money.parse('0.2'));
    expect(sum.minorUnits).toBe(30);
    expect(sum.decimalString).toBe('0.30');
  });
});

describe('Money aritmetiği', () => {
  it('toplama ve çıkarma tam minör birimde yapılır', () => {
    const a = Money.parse('19.99');
    const b = Money.parse('5.01');
    expect(a.add(b).decimalString).toBe('25.00');
    expect(a.subtract(b).decimalString).toBe('14.98');
  });

  it('çarpmada yarım kuruş sıfırdan uzağa yuvarlanır', () => {
    // 0.05 × 0.5 = 0.025 → 0.03 (yarım durumda sıfırdan uzağa)
    expect(Money.parse('0.05').multiply(0.5).decimalString).toBe('0.03');
    expect(Money.parse('-0.05').multiply(0.5).decimalString).toBe('-0.03');
  });

  it('bölmede yuvarlama tanımlı sınırda yapılır', () => {
    // 100 TL / 12 = 8.333… → 8.33
    expect(Money.parse('100').divide(12).decimalString).toBe('8.33');
    // 10 TL / 4 = 2.50 tam
    expect(Money.parse('10').divide(4).decimalString).toBe('2.50');
  });

  it('sıfıra bölme hata verir', () => {
    expect(() => Money.parse('1').divide(0)).toThrow(RangeError);
  });

  it('aylık tutardan yıllık tutar (×12) tam çıkar', () => {
    expect(Money.parse('9.99').multiply(12).decimalString).toBe('119.88');
  });

  it('compareTo sıralama yapar', () => {
    expect(Money.parse('1').compareTo(Money.parse('2'))).toBeLessThan(0);
    expect(Money.parse('2').compareTo(Money.parse('2'))).toBe(0);
  });
});

describe('Money serileştirme', () => {
  it('fromJson string ve sayıyı kabul eder', () => {
    expect(Money.fromJson('12.30').decimalString).toBe('12.30');
    expect(Money.fromJson(12.3).decimalString).toBe('12.30');
    expect(Money.fromJson(null).equals(Money.zero)).toBe(true);
  });

  it('JSON gövdesi ondalık string olarak çıkar', () => {
    expect(JSON.stringify({ amount: Money.parse('-1.05') })).toBe('{"amount":"-1.05"}');
  });

  it('güvenli tam sayı sınırını aşan değer reddedilir', () => {
    expect(() => Money.fromMinorUnits(Number.MAX_SAFE_INTEGER * 2)).toThrow(RangeError);
  });
});
