import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../../config/db.js';
import { Errors } from '../../lib/errors.js';

export async function getSubscription(id, userId) {
  const { rows } = await query(
    `SELECT s.*, bs.amount, bs.currency, bs.cycle, bs.interval_count,
            bs.next_renewal_at, bs.timezone, bs.anchor_day,
            c.code AS category_code
     FROM subscriptions s
     JOIN billing_schedules bs ON bs.subscription_id = s.id
     JOIN categories c ON c.id = s.category_id
     WHERE s.id = $1 AND s.user_id = $2`,
    [id, userId],
  );

  if (!rows.length) {
    throw Errors.notFound('SUBSCRIPTION_NOT_FOUND', 'Abonelik bulunamadı.');
  }

  return formatSubscription(rows[0]);
}

export async function listSubscriptions(userId, filters) {
  const { status, category, currency, q, sort = 'renewalAt,asc', cursor, limit = 20 } = filters;
  const params = [userId];
  const conditions = ['s.user_id = $1'];

  if (status) {
    params.push(status);
    conditions.push(`s.status = $${params.length}`);
  }
  if (category) {
    params.push(category);
    conditions.push(`c.code = $${params.length}`);
  }
  if (currency) {
    params.push(currency);
    conditions.push(`bs.currency = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`s.name ILIKE $${params.length}`);
  }
  if (cursor) {
    const separator = cursor.lastIndexOf('|');
    const cursorDate = separator >= 0 ? cursor.slice(0, separator) : cursor;
    const cursorId = separator >= 0 ? cursor.slice(separator + 1) : null;
    params.push(cursorDate);
    if (cursorId) {
      params.push(cursorId);
      conditions.push(`(bs.next_renewal_at, s.id) > ($${params.length - 1}, $${params.length})`);
    } else {
      conditions.push(`bs.next_renewal_at > $${params.length}`);
    }
  }

  const pageLimit = Math.min(parseInt(limit, 10) || 20, 100);
  params.push(pageLimit + 1);

  const { rows } = await query(
    `SELECT s.*, bs.amount, bs.currency, bs.cycle, bs.interval_count,
            bs.next_renewal_at, bs.timezone, bs.anchor_day,
            c.code AS category_code
     FROM subscriptions s
     JOIN billing_schedules bs ON bs.subscription_id = s.id
     JOIN categories c ON c.id = s.category_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY bs.next_renewal_at ASC, s.id ASC
     LIMIT $${params.length}`,
    params,
  );

  const hasMore = rows.length > pageLimit;
  const items = hasMore ? rows.slice(0, pageLimit) : rows;

  return {
    items: items.map(formatSubscription),
    nextCursor: hasMore
      ? `${new Date(items[items.length - 1].next_renewal_at).toISOString()}|${items[items.length - 1].id}`
      : null,
    hasMore,
  };
}

export async function createSubscription(userId, data) {
  return transaction(async (client) => {
    const { rows: cats } = await client.query(
      `SELECT id FROM categories WHERE code = $1`,
      [data.categoryCode],
    );
    if (!cats.length) throw Errors.validation('Geçersiz kategori kodu.', []);

    const subId = uuidv4();
    const { rows } = await client.query(
      `INSERT INTO subscriptions
         (id, user_id, service_id, category_id, name, status,
          website_url, account_url, cancellation_url, note,
          payment_method_label, trial_end_at, regular_amount, start_date,
          created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW())
       RETURNING *`,
      [
        subId, userId, data.serviceId ?? null, cats[0].id, data.name, data.status ?? 'ACTIVE',
        data.websiteUrl ?? null, data.accountUrl ?? null, data.cancellationUrl ?? null,
        data.note ?? null, data.paymentMethodLabel ?? null,
        data.trialEndAt ?? null, data.regularAmount ?? null,
        data.startDate ?? data.nextRenewalAt,
      ],
    );

    await client.query(
      `INSERT INTO billing_schedules
         (subscription_id, amount, currency, cycle, interval_count, next_renewal_at, timezone)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        subId, data.amount, data.currency, data.billingCycle,
        data.intervalCount ?? null, data.nextRenewalAt, data.timezone,
      ],
    );

    // Persist per-subscription notification override when provided.
    if (data.notifyDays != null) {
      await client.query(
        `UPDATE subscriptions SET notify_days = $2 WHERE id = $1`,
        [subId, data.notifyDays],
      ).catch(() => {}); // Column may not exist in older schemas — safe to ignore.
    }

    await client.query(
      `INSERT INTO subscription_events
         (id, subscription_id, user_id, event_type, new_values, occurred_at)
       VALUES ($1,$2,$3,'CREATED',$4,NOW())`,
      [uuidv4(), subId, userId, JSON.stringify(data)],
    );

    await _generateOccurrences(client, subId, userId, data.nextRenewalAt, data.billingCycle, data.amount, data.currency);

    return getSubscription(subId, userId);
  });
}

export async function patchSubscription(id, userId, data) {
  const sub = await getSubscription(id, userId);

  await transaction(async (client) => {
    if (data.categoryCode) {
      const { rows: cats } = await client.query(
        `SELECT id FROM categories WHERE code = $1`,
        [data.categoryCode],
      );
      if (!cats.length) throw Errors.validation('Geçersiz kategori kodu.', []);
      data._categoryId = cats[0].id;
    }

    await client.query(
      `UPDATE subscriptions SET
         category_id = COALESCE($3, category_id),
         name = COALESCE($4, name),
         website_url = COALESCE($5, website_url),
         account_url = COALESCE($6, account_url),
         cancellation_url = COALESCE($7, cancellation_url),
         note = COALESCE($8, note),
         payment_method_label = COALESCE($9, payment_method_label),
         trial_end_at = COALESCE($10, trial_end_at),
         regular_amount = COALESCE($11, regular_amount),
         start_date = COALESCE($12, start_date),
         updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [
        id, userId, data._categoryId ?? null, data.name ?? null,
        data.websiteUrl ?? null, data.accountUrl ?? null, data.cancellationUrl ?? null,
        data.note ?? null, data.paymentMethodLabel ?? null,
        data.trialEndAt ?? null, data.regularAmount ?? null, data.startDate ?? null,
      ],
    );

    if (data.amount || data.currency || data.billingCycle || data.nextRenewalAt || data.timezone) {
      await client.query(
        `UPDATE billing_schedules SET
           amount = COALESCE($2, amount),
           currency = COALESCE($3, currency),
           cycle = COALESCE($4, cycle),
           next_renewal_at = COALESCE($5, next_renewal_at),
           timezone = COALESCE($6, timezone)
         WHERE subscription_id = $1`,
        [
          id, data.amount ?? null, data.currency ?? null,
          data.billingCycle ?? null, data.nextRenewalAt ?? null, data.timezone ?? null,
        ],
      );
    }

    await client.query(
      `INSERT INTO subscription_events
         (id, subscription_id, user_id, event_type, old_values, new_values, occurred_at)
       VALUES ($1,$2,$3,'UPDATED',$4,$5,NOW())`,
      [uuidv4(), id, userId, JSON.stringify(sub), JSON.stringify(data)],
    );
  });

  // Refresh occurrences when the billing schedule changed.
  if (data.nextRenewalAt || data.billingCycle || data.amount || data.currency) {
    const updated = await getSubscription(id, userId);
    await transaction((c) => _generateOccurrences(
      c, id, userId,
      updated.nextRenewalAt, updated.billingCycle,
      updated.amount, updated.currency,
    )).catch(() => {});
  }

  return getSubscription(id, userId);
}

export async function changeStatus(id, userId, newStatus, extra = {}) {
  const validTransitions = {
    ACTIVE: ['PAUSED', 'CANCELLED', 'ARCHIVED'],
    TRIAL: ['ACTIVE', 'CANCELLED', 'ARCHIVED'],
    PAUSED: ['ACTIVE', 'CANCELLED', 'ARCHIVED'],
    CANCELLED: ['ARCHIVED'],
    EXPIRED: ['ARCHIVED'],
    ARCHIVED: ['ACTIVE'],
  };

  const sub = await getSubscription(id, userId);
  if (!validTransitions[sub.status]?.includes(newStatus)) {
    throw Errors.domain(
      'INVALID_STATUS_TRANSITION',
      `${sub.status} durumundan ${newStatus} durumuna geçiş yapılamaz.`,
    );
  }

  await transaction(async (client) => {
    await client.query(
      `UPDATE subscriptions SET
         status = $3,
         cancelled_at = COALESCE($4, cancelled_at),
         access_ends_at = COALESCE($5, access_ends_at),
         archived_at = CASE WHEN $3 = 'ARCHIVED' THEN NOW() ELSE archived_at END,
         updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [id, userId, newStatus, extra.cancelledAt ?? null, extra.accessEndsAt ?? null],
    );

    await client.query(
      `INSERT INTO subscription_events
         (id, subscription_id, user_id, event_type, old_values, new_values, occurred_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [uuidv4(), id, userId, `STATUS_${newStatus}`, JSON.stringify({ status: sub.status }), JSON.stringify({ status: newStatus, ...extra })],
    );

    // Cancel or archive: mark future occurrences as CANCELLED.
    if (newStatus === 'CANCELLED' || newStatus === 'ARCHIVED') {
      await client.query(
        `UPDATE renewal_occurrences
         SET status = 'CANCELLED'
         WHERE subscription_id = $1 AND scheduled_at > NOW() AND status = 'PENDING'`,
        [id],
      );
    }

    // Tasarruf kaydı — iptal veya durdurma
    if (newStatus === 'CANCELLED' || newStatus === 'PAUSED') {
      const monthlyAmount = normalizeMonthly(sub.amount, sub.billingCycle);
      await client.query(
        `INSERT INTO savings_events
           (id, subscription_id, user_id, event_type, monthly_amount, annual_amount, currency, effective_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
        [
          uuidv4(), id, userId,
          newStatus === 'CANCELLED' ? 'CANCELLED' : 'PAUSED',
          monthlyAmount,
          multiplyDecimal(monthlyAmount, 12),
          sub.currency,
        ],
      );
    }
  });

  return getSubscription(id, userId);
}

export async function deleteSubscription(id, userId) {
  const sub = await getSubscription(id, userId);

  await transaction(async (client) => {
    await client.query(`DELETE FROM billing_schedules WHERE subscription_id = $1`, [id]);
    await client.query(`DELETE FROM subscriptions WHERE id = $1 AND user_id = $2`, [id, userId]);
  });
}

function normalizeMonthly(amount, cycle) {
  const ratios = {
    WEEKLY: [52n, 12n],
    MONTHLY: [1n, 1n],
    QUARTERLY: [1n, 3n],
    BIANNUAL: [1n, 6n],
    ANNUAL: [1n, 12n],
  };
  if (!ratios[cycle]) {
    throw new Error(`normalizeMonthly: unsupported cycle '${cycle}' — use intervalCount-based calculation for CUSTOM cycles`);
  }
  const [numerator, denominator] = ratios[cycle];
  const scaled = decimalToScaled(amount, 4);
  return scaledToDecimal((scaled * numerator) / denominator, 4);
}

function multiplyDecimal(amount, factor) {
  return scaledToDecimal(decimalToScaled(amount, 4) * BigInt(factor), 4);
}

function decimalToScaled(value, scale) {
  const raw = String(value ?? '0');
  const negative = raw.startsWith('-');
  const [whole = '0', fraction = ''] = raw.replace('-', '').split('.');
  const digits = `${whole}${fraction.padEnd(scale, '0').slice(0, scale)}`;
  const scaled = BigInt(digits || '0');
  return negative ? -scaled : scaled;
}

function scaledToDecimal(value, scale) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const base = 10n ** BigInt(scale);
  return `${negative ? '-' : ''}${absolute / base}.${(absolute % base).toString().padStart(scale, '0')}`;
}

// Generate up to 13 months of future renewal occurrences for the calendar API.
async function _generateOccurrences(client, subscriptionId, userId, firstRenewalAt, cycle, amount, currency) {
  if (!firstRenewalAt || !cycle) return;

  const intervalMonths = { WEEKLY: null, MONTHLY: 1, QUARTERLY: 3, BIANNUAL: 6, ANNUAL: 12 };
  const months = intervalMonths[cycle];

  // Delete any existing pending future occurrences for this subscription to
  // avoid duplicates when called after an edit.
  await client.query(
    `DELETE FROM renewal_occurrences
     WHERE subscription_id = $1 AND status = 'PENDING' AND scheduled_at > NOW()`,
    [subscriptionId],
  );

  const occurrences = [];
  let current = new Date(firstRenewalAt);
  const horizon = new Date(current);
  horizon.setMonth(horizon.getMonth() + 13);

  // WEEKLY uses a 7-day step instead of calendar months.
  const step = cycle === 'WEEKLY' ? 7 : null;

  while (current <= horizon) {
    occurrences.push([uuidv4(), subscriptionId, userId, 'RENEWAL', current.toISOString(), amount, currency]);
    if (step) {
      current = new Date(current.getTime() + step * 24 * 60 * 60 * 1000);
    } else if (months) {
      current = new Date(current);
      current.setMonth(current.getMonth() + months);
    } else {
      break; // CUSTOM cycle — caller must handle occurrence generation
    }
  }

  if (!occurrences.length) return;

  const placeholders = occurrences.map((_, i) => {
    const base = i * 7;
    return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7})`;
  }).join(',');

  await client.query(
    `INSERT INTO renewal_occurrences
       (id, subscription_id, user_id, type, scheduled_at, expected_amount, currency)
     VALUES ${placeholders}
     ON CONFLICT DO NOTHING`,
    occurrences.flat(),
  );
}

function formatSubscription(r) {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    status: r.status,
    categoryCode: r.category_code,
    amount: r.amount,
    currency: r.currency,
    billingCycle: r.cycle,
    startDate: r.start_date,
    nextRenewalAt: r.next_renewal_at,
    timezone: r.timezone,
    trialEndAt: r.trial_end_at,
    regularAmount: r.regular_amount,
    cancelledAt: r.cancelled_at,
    accessEndsAt: r.access_ends_at,
    archivedAt: r.archived_at,
    websiteUrl: r.website_url,
    accountUrl: r.account_url,
    cancellationUrl: r.cancellation_url,
    paymentMethodLabel: r.payment_method_label,
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
