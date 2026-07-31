import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/db.js';
import { Errors } from '../../lib/errors.js';

const router = Router();

// GET /notifications?unreadOnly=true&cursor=...
router.get('/', async (req, res, next) => {
  try {
    const { unreadOnly, cursor, limit = 20 } = req.query;
    const params = [req.userId];
    const conditions = ['n.user_id = $1'];

    if (unreadOnly === 'true') {
      conditions.push('n.read_at IS NULL');
    }
    if (cursor) {
      params.push(cursor);
      conditions.push(`n.created_at < $${params.length}`);
    }

    const pageLimit = Math.min(parseInt(limit, 10) || 20, 100);
    params.push(pageLimit + 1);

    const { rows } = await query(
      `SELECT n.id, n.subscription_id, n.type, n.title_key, n.body_params,
              n.deep_link, n.read_at, n.created_at
       FROM notifications n
       WHERE ${conditions.join(' AND ')}
       ORDER BY n.created_at DESC
       LIMIT $${params.length}`,
      params,
    );

    const hasMore = rows.length > pageLimit;
    const items = hasMore ? rows.slice(0, pageLimit) : rows;

    res.json({
      items: items.map((r) => ({
        id: r.id,
        subscriptionId: r.subscription_id,
        type: r.type,
        titleKey: r.title_key,
        bodyParams: r.body_params,
        deepLink: r.deep_link,
        readAt: r.read_at,
        createdAt: r.created_at,
      })),
      nextCursor: hasMore ? items[items.length - 1].created_at : null,
      hasMore,
    });
  } catch (err) {
    next(err);
  }
});

// POST /notifications/:id/read
router.post('/:id/read', async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE notifications SET read_at = NOW()
       WHERE id = $1 AND user_id = $2 AND read_at IS NULL
       RETURNING id`,
      [req.params.id, req.userId],
    );
    if (!rows.length) return next(Errors.notFound('NOTIFICATION_NOT_FOUND', 'Bildirim bulunamadı.'));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /notifications/read-all
router.post('/read-all', async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`,
      [req.userId],
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /notification-preferences
router.get('/preferences', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT default_notify_days, push_enabled, in_app_enabled, email_enabled
       FROM profiles WHERE user_id = $1`,
      [req.userId],
    );
    const p = rows[0] ?? {};
    res.json({
      defaultNotifyDays: p.default_notify_days ?? 3,
      pushEnabled: p.push_enabled ?? true,
      inAppEnabled: p.in_app_enabled ?? true,
      emailEnabled: p.email_enabled ?? false,
    });
  } catch (err) {
    next(err);
  }
});

const PrefsSchema = z.object({
  defaultNotifyDays: z.number().int().min(0).max(30).optional(),
  pushEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
});

// PUT /notification-preferences
router.put('/preferences', async (req, res, next) => {
  try {
    const parsed = PrefsSchema.safeParse(req.body);
    if (!parsed.success) return next(Errors.validation('Geçersiz tercih verisi.', parsed.error.errors));

    const d = parsed.data;
    await query(
      `UPDATE profiles SET
         default_notify_days = COALESCE($2, default_notify_days),
         push_enabled = COALESCE($3, push_enabled),
         in_app_enabled = COALESCE($4, in_app_enabled),
         email_enabled = COALESCE($5, email_enabled)
       WHERE user_id = $1`,
      [req.userId, d.defaultNotifyDays ?? null, d.pushEnabled ?? null, d.inAppEnabled ?? null, d.emailEnabled ?? null],
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

const DeviceSchema = z.object({
  platform: z.enum(['IOS', 'ANDROID']),
  token: z.string().min(1).max(1024),
  appVersion: z.string().max(32).optional(),
});

// POST /devices
router.post('/devices', async (req, res, next) => {
  try {
    const parsed = DeviceSchema.safeParse(req.body);
    if (!parsed.success) return next(Errors.validation('Geçersiz device verisi.', parsed.error.errors));

    const { platform, token, appVersion } = parsed.data;
    const id = uuidv4();

    await query(
      `INSERT INTO device_tokens (id, user_id, platform, encrypted_token, app_version, last_seen_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (encrypted_token) DO UPDATE SET last_seen_at = NOW(), app_version = $5`,
      [id, req.userId, platform, token, appVersion ?? null],
    );

    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
});

// DELETE /devices/:id
router.delete('/devices/:id', async (req, res, next) => {
  try {
    await query(
      `UPDATE device_tokens SET revoked_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
