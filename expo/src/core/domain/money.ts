/**
 * Tam sayı minör birimde (kuruş / cent) tutulan para değeri.
 *
 * Flutter sürümündeki `Money` sınıfının birebir karşılığıdır ([ADR 0004](../../../../docs/decisions/0004-money-as-decimal.md)).
 * Floating point ile toplama yapılmaz; `number` yalnızca tam sayı minör birimler
 * için kullanılır ve güvenli tam sayı sınırı aşılırsa hata verilir.
 *
 * Wire formatı (API ve veritabanı) ondalık string'dir: `"12.34"`.
 */
export class Money {
  private constructor(private readonly minor: number) {
    if (!Number.isSafeInteger(minor)) {
      throw new RangeError(`Money minör birimi güvenli tam sayı değil: ${minor}`);
    }
  }

  static readonly zero = new Money(0);

  /** Girdi geçersizse `null` döner. Form doğrulaması için tercih edilir. */
  static tryParse(input: string): Money | null {
    const normalized = input.trim().replace(/,/g, '.');
    const match = /^(-?)(\d+)(?:\.(\d{0,2}))?$/.exec(normalized);
    if (!match) return null;
    const whole = Number.parseInt(match[2], 10);
    const fraction = Number.parseInt((match[3] ?? '').padEnd(2, '0'), 10) || 0;
    const minor = whole * 100 + fraction;
    return new Money(match[1] === '-' ? -minor : minor);
  }

  /** Geçersiz girdide sıfır döner (Flutter `Money.parse` ile aynı davranış). */
  static parse(input: string): Money {
    return Money.tryParse(input) ?? Money.zero;
  }

  /** API'den gelen değer string veya sayı olabilir (eski yerel cache sayı tutabilir). */
  static fromJson(json: unknown): Money {
    if (typeof json === 'string') return Money.parse(json);
    if (typeof json === 'number' && Number.isFinite(json)) return Money.parse(String(json));
    return Money.zero;
  }

  static fromMinorUnits(minor: number): Money {
    return new Money(Math.trunc(minor));
  }

  get minorUnits(): number {
    return this.minor;
  }

  /** Yalnızca gösterim için. Kalıcı veri veya API hesabında kullanılmaz. */
  get amount(): number {
    return this.minor / 100;
  }

  /** Tam ondalık gösterim: `-1234` → `"-12.34"`. */
  get decimalString(): string {
    const sign = this.minor < 0 ? '-' : '';
    const absolute = Math.abs(this.minor);
    const whole = Math.trunc(absolute / 100);
    const fraction = String(absolute % 100).padStart(2, '0');
    return `${sign}${whole}.${fraction}`;
  }

  add(other: Money): Money {
    return new Money(this.minor + other.minor);
  }

  subtract(other: Money): Money {
    return new Money(this.minor - other.minor);
  }

  /** Yuvarlama: yarım durumda sıfırdan uzağa (Flutter `round()` ile aynı). */
  multiply(factor: number): Money {
    return new Money(roundHalfAwayFromZero(this.minor * factor));
  }

  /** Yuvarlama: yarım durumda sıfırdan uzağa. */
  divide(divisor: number): Money {
    if (divisor === 0) throw new RangeError('Money sıfıra bölünemez');
    return new Money(roundHalfAwayFromZero(this.minor / divisor));
  }

  compareTo(other: Money): number {
    return Math.sign(this.minor - other.minor);
  }

  equals(other: Money): boolean {
    return this.minor === other.minor;
  }

  toJSON(): string {
    return this.decimalString;
  }

  toString(): string {
    return `Money(${this.decimalString})`;
  }
}

function roundHalfAwayFromZero(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}
