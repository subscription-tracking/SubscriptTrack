import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/db.js';
import { Errors } from '../../lib/errors.js';

const router = Router();

const readBatchSchema = z.object({
  notification_ids: z.array(z.string().min(1)).min(1).max(200),
});

router.post('/read-batch', async (req, res, next) => {
  try {
    const parsed = readBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(Errors.validation('Invalid notification ids.', parsed.error.errors));
    }
    const { rowCount } = await query(
      `UPDATE notifications SET read_at = NOW()
       WHERE user_id = $1 AND id::text = ANY($2::text[]) AND read_at IS NULL`,
      [req.userId, parsed.data.notification_ids],
    );
    res.json({ updatedCount: rowCount });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { unreadOnly, cursor, limit = 20 } = req.query;
    const params = [req.userId];
    const conditions = ['n.user_id = $1'];
    if (unreadOnly === 'true') conditions.push('n.read_at IS NULL');
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
      items: items.map((row) => ({
        id: row.id,
        subscriptionId: row.subscription_id,
        type: row.type,
        titleKey: row.title_key,
        bodyParams: row.body_params,
        deepLink: row.deep_link,
        readAt: row.read_at,
        createdAt: row.created_at,
      })),
      nextCursor: hasMore ? items[items.length - 1].created_at : null,
      hasMore,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/read', async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE notifications SET read_at = NOW()
       WHERE id = $1 AND user_id = $2 AND read_at IS NULL
       RETURNING id`,
      [req.params.id, req.userId],
    );
    if (!rows.length) {
      return next(Errors.notFound('NOTIFICATION_NOT_FOUND', 'Notification not found.'));
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/read-all', async (req, res, next) => {
  try {
    await query(
      'UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
      [req.userId],
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/preferences', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT default_notify_days, push_enabled, in_app_enabled, email_enabled
       FROM profiles WHERE user_id = $1`,
      [req.userId],
    );
    const profile = rows[0] ?? {};
    res.json({
      defaultNotifyDays: profile.default_notify_days ?? 3,
      pushEnabled: profile.push_enabled ?? true,
      inAppEnabled: profile.in_app_enabled ?? true,
      emailEnabled: profile.email_enabled ?? false,
    });
  } catch (err) {
    next(err);
  }
});

const preferencesSchema = z.object({
  defaultNotifyDays: z.number().int().min(0).max(30).optional(),
  pushEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
});

router.put('/preferences', async (req, res, next) => {
  try {
    const parsed = preferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(Errors.validation('Invalid notification preferences.', parsed.error.errors));
    }
    const value = parsed.data;
    await query(
      `UPDATE profiles SET
         default_notify_days = COALESCE($2, default_notify_days),
         push_enabled = COALESCE($3, push_enabled),
         in_app_enabled = COALESCE($4, in_app_enabled),
         email_enabled = COALESCE($5, email_enabled)
       WHERE user_id = $1`,
      [req.userId, value.defaultNotifyDays ?? null, value.pushEnabled ?? null,
        value.inAppEnabled ?? null, value.emailEnabled ?? null],
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Device registrations are retained as a backend contract. No mobile push
// provider is currently connected to this endpoint.
const deviceSchema = z.object({
  platform: z.enum(['IOS', 'ANDROID']),
  token: z.string().min(1).max(1024),
  appVersion: z.string().max(32).optional(),
});

router.post('/devices', async (req, res, next) => {
  try {
    const parsed = deviceSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(Errors.validation('Invalid device registration.', parsed.error.errors));
    }
    const { platform, token, appVersion } = parsed.data;
    const id = uuidv4();
    await query(
      `INSERT INTO device_tokens (id, user_id, platform, token, app_version, last_seen_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (token) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         platform = EXCLUDED.platform,
         app_version = EXCLUDED.app_version,
         last_seen_at = NOW(),
         revoked_at = NULL`,
      [id, req.userId, platform, token, appVersion ?? null],
    );
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
});

router.delete('/devices/:id', async (req, res, next) => {
  try {
    await query(
      `UPDATE device_tokens SET revoked_at = NOW() WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
