import { Router } from 'express';
import { query } from '../../config/db.js';
import { Errors } from '../../lib/errors.js';

const router = Router();

// GET /calendar?from=2026-08-01&to=2026-08-31
router.get('/', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return next(Errors.validation('from ve to parametreleri zorunludur.', []));
    }

    const { rows } = await query(
      `SELECT ro.id AS occurrence_id, ro.subscription_id, s.name,
              ro.type, ro.scheduled_at, ro.expected_amount AS amount,
              ro.currency, ro.status
       FROM renewal_occurrences ro
       JOIN subscriptions s ON s.id = ro.subscription_id
       WHERE ro.user_id = $1
         AND ro.scheduled_at >= $2::TIMESTAMPTZ
         AND ro.scheduled_at < $3::TIMESTAMPTZ
         AND ro.status NOT IN ('CANCELLED','SKIPPED')
       ORDER BY ro.scheduled_at ASC`,
      [req.userId, from, to],
    );

    res.json({
      items: rows.map((r) => ({
        occurrenceId: r.occurrence_id,
        subscriptionId: r.subscription_id,
        name: r.name,
        type: r.type,
        scheduledAt: r.scheduled_at,
        amount: r.amount,
        currency: r.currency,
        status: r.status,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
