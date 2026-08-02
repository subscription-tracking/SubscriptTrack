import { Router } from 'express';
import { query } from '../../config/db.js';

const router = Router();

// GET /dashboard/summary
router.get('/summary', async (req, res, next) => {
  try {
    const userId = req.userId;

    // Para birimi bazında toplam — aylık normalize edilmiş.
    // NUMERIC(19,4) aritmetiği kullanılıyor; tamsayı bölmesinden kaynaklanan
    // yuvarlama hatalarını önler (ör. 52/12 = 4 yerine 4.3333...).
    const { rows: totals } = await query(
      `SELECT bs.currency,
              SUM(
                CASE bs.cycle
                  WHEN 'WEEKLY'    THEN bs.amount::NUMERIC(19,4) * 52 / 12
                  WHEN 'MONTHLY'   THEN bs.amount::NUMERIC(19,4)
                  WHEN 'QUARTERLY' THEN bs.amount::NUMERIC(19,4) / 3
                  WHEN 'BIANNUAL'  THEN bs.amount::NUMERIC(19,4) / 6
                  WHEN 'ANNUAL'    THEN bs.amount::NUMERIC(19,4) / 12
                  ELSE             bs.amount::NUMERIC(19,4)
                END
              ) AS monthly_total
       FROM subscriptions s
       JOIN billing_schedules bs ON bs.subscription_id = s.id
       WHERE s.user_id = $1 AND s.status IN ('ACTIVE', 'TRIAL')
       GROUP BY bs.currency`,
      [userId],
    );

    const { rows: counts } = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('ACTIVE','TRIAL')) AS active_count,
         COUNT(*) FILTER (WHERE status = 'TRIAL') AS trial_count,
         COUNT(*) FILTER (WHERE bs.next_renewal_at <= NOW() + INTERVAL '7 days'
                          AND s.status IN ('ACTIVE','TRIAL')) AS upcoming_count
       FROM subscriptions s
       JOIN billing_schedules bs ON bs.subscription_id = s.id
       WHERE s.user_id = $1`,
      [userId],
    );

    const { rows: savings } = await query(
      `SELECT currency, SUM(annual_amount) AS annual_total
       FROM savings_events
       WHERE user_id = $1
       GROUP BY currency`,
      [userId],
    );

    const c = counts[0];

    res.json({
      monthlyTotals: totals.map((r) => ({
        currency: r.currency,
        amount: formatDecimal(r.monthly_total, 2),
      })),
      annualTotals: totals.map((r) => ({
        currency: r.currency,
        amount: multiplyDecimal(r.monthly_total, 12, 2),
      })),
      activeSubscriptionCount: parseInt(c.active_count, 10),
      upcomingCount: parseInt(c.upcoming_count, 10),
      trialCount: parseInt(c.trial_count, 10),
      estimatedSavings: savings.map((r) => ({
        currency: r.currency,
        annualAmount: formatDecimal(r.annual_total, 2),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /dashboard/upcoming?days=7
router.get('/upcoming', async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days ?? '7', 10), 90);

    const { rows } = await query(
      `SELECT s.id, s.name, s.status, c.code AS category_code,
              bs.amount, bs.currency, bs.next_renewal_at
       FROM subscriptions s
       JOIN billing_schedules bs ON bs.subscription_id = s.id
       JOIN categories c ON c.id = s.category_id
       WHERE s.user_id = $1
         AND s.status IN ('ACTIVE','TRIAL')
         AND bs.next_renewal_at <= NOW() + ($2 || ' days')::INTERVAL
         AND bs.next_renewal_at >= NOW()
       ORDER BY bs.next_renewal_at ASC`,
      [req.userId, days],
    );

    res.json({
      items: rows.map((r) => ({
        id: r.id,
        name: r.name,
        status: r.status,
        categoryCode: r.category_code,
        amount: r.amount,
        currency: r.currency,
        nextRenewalAt: r.next_renewal_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;

function formatDecimal(value, scale) {
  const [whole = '0', fraction = ''] = String(value ?? '0').split('.');
  return `${whole}.${fraction.padEnd(scale, '0').slice(0, scale)}`;
}

function multiplyDecimal(value, factor, scale) {
  const [whole = '0', fraction = ''] = String(value ?? '0').split('.');
  const negative = whole.startsWith('-');
  const digits = `${whole.replace('-', '')}${fraction.padEnd(scale, '0').slice(0, scale)}`;
  const scaled = BigInt(digits || '0') * BigInt(factor);
  const base = 10n ** BigInt(scale);
  return `${negative ? '-' : ''}${scaled / base}.${(scaled % base).toString().padStart(scale, '0')}`;
}
