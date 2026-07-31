import { Router } from 'express';
import { query } from '../../config/db.js';

const router = Router();

// GET /services?query=netflix&category=ENTERTAINMENT
router.get('/services', async (req, res, next) => {
  try {
    const { query: q, category, cursor, limit = 20 } = req.query;
    const params = [];
    const conditions = ['s.is_active = true'];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`s.name ILIKE $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`c.code = $${params.length}`);
    }
    if (cursor) {
      params.push(cursor);
      conditions.push(`s.name > $${params.length}`);
    }

    const pageLimit = Math.min(parseInt(limit, 10) || 20, 100);
    params.push(pageLimit + 1);

    const { rows } = await query(
      `SELECT s.id, s.slug, s.name, s.logo_url, s.account_url, s.cancellation_url,
              s.last_verified_at, c.code AS category_code
       FROM services s
       LEFT JOIN categories c ON c.id = s.category_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY s.name ASC
       LIMIT $${params.length}`,
      params,
    );

    const hasMore = rows.length > pageLimit;
    const items = hasMore ? rows.slice(0, pageLimit) : rows;

    res.json({
      items: items.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        logoUrl: r.logo_url,
        categoryCode: r.category_code,
        accountUrl: r.account_url,
        cancellationUrl: r.cancellation_url,
        lastVerifiedAt: r.last_verified_at,
      })),
      nextCursor: hasMore ? items[items.length - 1].name : null,
      hasMore,
    });
  } catch (err) {
    next(err);
  }
});

// GET /categories
router.get('/categories', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, code, display_name_key, icon_key, sort_order
       FROM categories
       WHERE is_system = true
       ORDER BY sort_order ASC`,
    );

    res.json({
      items: rows.map((r) => ({
        id: r.id,
        code: r.code,
        displayNameKey: r.display_name_key,
        iconKey: r.icon_key,
        sortOrder: r.sort_order,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
