import { randomUUID } from 'expo-crypto';

import { type CivilDate } from '../../../core/time/calendar';
import { type ImportRow } from '../domain/csvImportParser';
import { canTransition } from '../domain/statusTransitions';
import { type SubscriptionFormValues, hasErrors, toCreatePayload, validateSubscriptionForm } from '../domain/subscriptionForm';
import { type SubscriptionStatus } from '../domain/subscription';
import { changeSubscriptionStatus } from './subscriptionMutations';
import { createSubscription } from './subscriptionWriteRepository';

/**
 * CSV satırlarını abonelik olarak oluşturur. Her satır ayrı işlemdir: bir satırın hatası diğerlerini durdurmaz.
 * İçe aktarma çevrimiçi yapılır (satırlar kuyruğa alınmaz; hata ve kimlik gerektirir).
 *
 * Oluşturma sonrası durum: RPC her kaydı `active` (deneme varsa `trial`) olarak açar. CSV durumu farklıysa
 * ve geçiş izinliyse durum değiştirilir; izinli değilse satır oluşturulmuş sayılır ve uyarı verilir.
 */

export interface ImportFailure {
  line: number;
  name: string;
  message: string;
}

export interface ImportOutcome {
  created: number;
  failures: ImportFailure[];
  warnings: string[];
}

function formValuesFor(row: ImportRow, today: CivilDate): SubscriptionFormValues {
  return {
    name: row.name,
    amount: row.amount.decimalString,
    currency: row.currency,
    billingCycle: row.billingCycle,
    category: row.category,
    startDate: today,
    nextRenewalDate: row.nextRenewalDate,
    notes: row.notes ?? '',
    paymentMethod: row.paymentMethod ?? '',
    isTrial: row.trialEndDate !== null,
    trialEndDate: row.trialEndDate,
    trialPrice: row.trialPriceAfter?.decimalString ?? '',
    initialPaid: false,
    initialPaymentDate: today,
  };
}

export async function importSubscriptionRows(
  userId: string,
  rows: readonly ImportRow[],
  today: CivilDate,
  onProgress: (done: number, total: number) => void,
): Promise<ImportOutcome> {
  const outcome: ImportOutcome = { created: 0, failures: [], warnings: [] };

  for (const [index, row] of rows.entries()) {
    onProgress(index, rows.length);
    const values = formValuesFor(row, today);
    const errors = validateSubscriptionForm(values);
    if (hasErrors(errors)) {
      outcome.failures.push({ line: row.line, name: row.name, message: Object.values(errors).filter(Boolean).join(' ') });
      continue;
    }

    try {
      const id = await createSubscription(toCreatePayload(values, randomUUID()));
      outcome.created += 1;
      const createdStatus: SubscriptionStatus = row.trialEndDate ? 'trial' : 'active';
      if (id && row.status !== createdStatus) {
        if (canTransition(createdStatus, row.status)) {
          await changeSubscriptionStatus({ userId, subscriptionId: id, to: row.status, idempotencyKey: randomUUID() });
        } else {
          outcome.warnings.push(`Satır ${row.line}: "${row.name}" eklendi; durum (${row.status}) içe aktarılamadı.`);
        }
      }
    } catch (error) {
      outcome.failures.push({
        line: row.line,
        name: row.name,
        message: error instanceof Error ? error.message : 'Kaydedilemedi.',
      });
    }
  }

  onProgress(rows.length, rows.length);
  return outcome;
}
