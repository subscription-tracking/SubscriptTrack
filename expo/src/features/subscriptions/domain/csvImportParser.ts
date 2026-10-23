import { Money } from '../../../core/domain/money';
import { type BillingCycle, type CivilDate, parseCivilDate } from '../../../core/time/calendar';
import { SUBSCRIPTION_CATEGORIES, SUBSCRIPTION_LIMITS, SUBSCRIPTION_STATUSES, type SubscriptionCategory, type SubscriptionStatus } from './subscription';

/**
 * CSV içe aktarma ayrıştırıcısı. Şema ve doğrulamalar Flutter ile eşleşir; Expo ayrıca tırnak içi çok satırlı alanları destekler.
 * Zorunlu başlıklar: name, amount, currency, billing_cycle, next_renewal_date, category.
 * Başlıklar büyük/küçük harf ve Türkçe karakterden bağımsızdır. Dışa aktarmanın formül koruması (`'`)
 * geri alınır, böylece dışa aktarılan dosya değişmeden geri içe aktarılır. I/O yoktur.
 */

export const REQUIRED_HEADERS = ['name', 'amount', 'currency', 'billing_cycle', 'next_renewal_date', 'category'] as const;
export const MAX_IMPORT_ROWS = 500;
const TRIGGERS = ['=', '+', '-', '@', '\t', '\r'];

export interface ImportRow {
  line: number;
  name: string;
  amount: Money;
  currency: string;
  billingCycle: BillingCycle;
  nextRenewalDate: CivilDate;
  category: SubscriptionCategory;
  status: SubscriptionStatus;
  notes: string | null;
  paymentMethod: string | null;
  trialEndDate: CivilDate | null;
  trialPriceAfter: Money | null;
}

export interface ParseResult {
  rows: ImportRow[];
  errors: string[];
}

/** Başlık normalizasyonu: küçük harf, boşluk → `_`, Türkçe harfler ASCII karşılığına. */
export function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ /g, '_')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

/** Dışa aktarmanın eklediği formül koruma `'` önekini geri alır. */
export function restoreFormula(value: string): string {
  return value.length > 1 && value[0] === "'" && TRIGGERS.includes(value[1]) ? value.slice(1) : value;
}

/** Tırnaklı CSV alanlarını ayırır (`""` kaçışı destekli). */
export function splitCsvLine(line: string): string[] {
  return parseCsvRecords(line)[0] ?? [''];
}

/** CSV kayıtlarını CRLF/LF satır sonları ve tırnak içindeki satır sonlarını koruyarak okur. */
export function parseCsvRecords(input: string): string[][] {
  const records: string[][] = [];
  let fields: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === '"') {
      if (quoted && input[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && char === ',') {
      fields.push(current);
      current = '';
    } else if (!quoted && (char === '\r' || char === '\n')) {
      fields.push(current);
      records.push(fields);
      fields = [];
      current = '';
      if (char === '\r' && input[index + 1] === '\n') index += 1;
    } else {
      current += char;
    }
  }
  fields.push(current);
  if (fields.some((field) => field.length > 0) || records.length === 0 || input.length === 0 || !/[\r\n]$/.test(input)) {
    records.push(fields);
  }
  return records;
}

function cycleFrom(value: string): BillingCycle {
  switch (normalizeHeader(value)) {
    case 'yearly':
    case 'annual':
    case 'yillik':
      return 'yearly';
    case 'weekly':
    case 'haftalik':
      return 'weekly';
    case 'quarterly':
    case '3_months':
    case '3_aylik':
      return 'quarterly';
    default:
      return 'monthly';
  }
}

function categoryFrom(value: string): SubscriptionCategory {
  const key = normalizeHeader(value);
  return (SUBSCRIPTION_CATEGORIES as readonly string[]).includes(key) ? (key as SubscriptionCategory) : 'other';
}

function statusFrom(value: string): SubscriptionStatus {
  const key = normalizeHeader(value);
  return (SUBSCRIPTION_STATUSES as readonly string[]).includes(key) ? (key as SubscriptionStatus) : 'active';
}

function positiveMoney(value: string): Money | null {
  const money = Money.tryParse(value);
  return money && money.compareTo(Money.zero) > 0 ? money : null;
}

export function parseSubscriptionCsv(input: string): ParseResult {
  const records = parseCsvRecords(input).filter((values) => values.some((field) => field.trim().length > 0));
  if (records.length === 0) return { rows: [], errors: ['CSV dosyası boş.'] };

  const headers = records[0].map(normalizeHeader);
  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length > 0) return { rows: [], errors: [`Eksik başlık: ${missing.join(', ')}`] };

  const index = (key: string) => headers.indexOf(key);
  const cell = (values: string[], key: string) => {
    const position = index(key);
    return position >= 0 && position < values.length ? restoreFormula(values[position].trim()) : '';
  };

  const rows: ImportRow[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  const dataRecords = records.slice(1);
  if (dataRecords.length > MAX_IMPORT_ROWS) {
    errors.push(`En fazla ${MAX_IMPORT_ROWS} satır içe aktarılabilir; fazlası atlandı.`);
  }

  dataRecords.slice(0, MAX_IMPORT_ROWS).forEach((values, offset) => {
    const line = offset + 2;
    const name = cell(values, 'name');
    const amount = positiveMoney(cell(values, 'amount'));
    const nextRenewalDate = parseCivilDate(cell(values, 'next_renewal_date'));
    const trialRaw = cell(values, 'trial_end_date');
    const trialEndDate = trialRaw ? parseCivilDate(trialRaw) : null;
    const trialPriceRaw = cell(values, 'trial_price_after');
    const trialPriceAfter = trialPriceRaw ? positiveMoney(trialPriceRaw) : null;
    const currency = (cell(values, 'currency') || 'TRY').toLocaleUpperCase('tr-TR');

    if (!name || !amount || amount.minorUnits > SUBSCRIPTION_LIMITS.amountMaxMinorUnits || !nextRenewalDate || (trialRaw !== '' && !trialEndDate) || (trialPriceRaw !== '' && !trialPriceAfter)) {
      errors.push(`Satır ${line}: ad, tutar veya tarih geçersiz.`);
      return;
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      errors.push(`Satır ${line}: para birimi geçersiz.`);
      return;
    }
    const key = name.toLocaleLowerCase('tr-TR');
    if (seen.has(key)) {
      errors.push(`Satır ${line}: aynı abonelik tekrar ediyor.`);
      return;
    }
    seen.add(key);

    rows.push({
      line,
      name,
      amount,
      currency,
      billingCycle: cycleFrom(cell(values, 'billing_cycle')),
      nextRenewalDate,
      category: categoryFrom(cell(values, 'category')),
      status: statusFrom(cell(values, 'status')),
      notes: cell(values, 'notes') || null,
      paymentMethod: cell(values, 'payment_method') || null,
      trialEndDate,
      trialPriceAfter,
    });
  });

  return { rows, errors };
}

/** Başlıklar ve bir örnek satır (kullanıcıya gösterilir ve kopyalanabilir). */
export const CSV_TEMPLATE =
  'name,amount,currency,billing_cycle,next_renewal_date,category,status,notes,payment_method,trial_end_date,trial_price_after\nNetflix,149.99,TRY,monthly,2026-10-15,streaming,active,,,,';
