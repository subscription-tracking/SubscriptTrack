import { Router } from 'express';
import { query } from '../../config/db.js';

const router = Router();

// GET /savings/summary
router.get('/summary', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT currency,
              SUM(monthly_amount) AS total_monthly,
              SUM(annual_amount) AS total_annual
       FROM savings_events
       WHERE user_id = $1
       GROUP BY currency`,
      [req.userId],
    );

    res.json({
      totals: rows.map((r) => ({
        currency: r.currency,
        monthlyAmount: parseFloat(r.total_monthly).toFixed(2),
        annualAmount: parseFloat(r.total_annual).toFixed(2),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /savings/events?cursor=...
router.get('/events', async (req, res, next) => {
  try {
    const { cursor, limit = 20 } = req.query;
    const params = [req.userId];
    const conditions = ['se.user_id = $1'];

    if (cursor) {
      params.push(cursor);
      conditions.push(`se.effective_at < $${params.length}`);
    }

    const pageLimit = Math.min(parseInt(limit, 10) || 20, 100);
    params.push(pageLimit + 1);

    const { rows } = await query(
      `SELECT se.id, se.subscription_id, s.name AS subscription_name,
              se.event_type, se.monthly_amount, se.annual_amount,
              se.currency, se.effective_at
       FROM savings_events se
       JOIN subscriptions s ON s.id = se.subscription_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY se.effective_at DESC
       LIMIT $${params.length}`,
      params,
    );

    const hasMore = rows.length > pageLimit;
    const items = hasMore ? rows.slice(0, pageLimit) : rows;

    res.json({
      items: items.map((r) => ({
        id: r.id,
        subscriptionId: r.subscription_id,
        subscriptionName: r.subscription_name,
        eventType: r.event_type,
        monthlyAmount: r.monthly_amount,
        annualAmount: r.annual_amount,
        currency: r.currency,
        effectiveAt: r.effective_at,
      })),
      nextCursor: hasMore ? items[items.length - 1].effective_at : null,
      hasMore,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
