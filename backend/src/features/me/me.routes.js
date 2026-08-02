import { Router } from 'express';
import { z } from 'zod';
import { query, transaction } from '../../config/db.js';
import { Errors } from '../../lib/errors.js';

// Permanently erases all personal data for a user (GDPR right to erasure).
// Cascades handle child rows (subscriptions → billing_schedules, events, etc.).
async function _eraseUserData(userId) {
  await transaction(async (client) => {
    await client.query(`DELETE FROM renewal_occurrences WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM savings_events WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM exports WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM notifications WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM device_tokens WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM subscriptions WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM profiles WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
  });
}

const router = Router();

// GET /me
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.email, u.status,
              p.first_name, p.last_name, p.preferred_currency,
              p.timezone, p.locale, p.theme,
              p.default_notify_days, p.push_enabled, p.in_app_enabled, p.email_enabled
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1 AND u.status = 'ACTIVE'`,
      [req.userId],
    );

    if (!rows.length) return next(Errors.notFound('USER_NOT_FOUND', 'Kullanıcı bulunamadı.'));

    const u = rows[0];
    res.json({
      id: u.id,
      email: u.email,
      profile: {
        firstName: u.first_name,
        lastName: u.last_name,
        preferredCurrency: u.preferred_currency,
        timezone: u.timezone,
        locale: u.locale,
        theme: u.theme,
      },
    });
  } catch (err) {
    next(err);
  }
});

const PatchProfileSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  preferredCurrency: z.string().length(3).optional(),
  timezone: z.string().max(64).optional(),
  locale: z.string().max(16).optional(),
  theme: z.enum(['SYSTEM', 'LIGHT', 'DARK']).optional(),
  defaultNotifyDays: z.number().int().min(1).max(30).optional(),
  pushEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
});

// PATCH /me/profile
router.patch('/profile', async (req, res, next) => {
  try {
    const parsed = PatchProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(Errors.validation('Geçersiz profil verisi.', parsed.error.errors));
    }

    const d = parsed.data;
    await query(
      `INSERT INTO profiles (user_id, first_name, last_name, preferred_currency, timezone, locale, theme, default_notify_days, push_enabled, in_app_enabled, email_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (user_id) DO UPDATE SET
         first_name = COALESCE($2, profiles.first_name),
         last_name = COALESCE($3, profiles.last_name),
         preferred_currency = COALESCE($4, profiles.preferred_currency),
         timezone = COALESCE($5, profiles.timezone),
         locale = COALESCE($6, profiles.locale),
         theme = COALESCE($7, profiles.theme),
         default_notify_days = COALESCE($8, profiles.default_notify_days),
         push_enabled = COALESCE($9, profiles.push_enabled),
         in_app_enabled = COALESCE($10, profiles.in_app_enabled),
         email_enabled = COALESCE($11, profiles.email_enabled)`,
      [
        req.userId,
        d.firstName ?? null,
        d.lastName ?? null,
        d.preferredCurrency ?? null,
        d.timezone ?? null,
        d.locale ?? null,
        d.theme ?? null,
        d.defaultNotifyDays ?? null,
        d.pushEnabled ?? null,
        d.inAppEnabled ?? null,
        d.emailEnabled ?? null,
      ],
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /me — GDPR hesap silme akışını başlatır.
// Kullanıcı kaydı DELETION_PENDING olarak işaretlenir, ardından arka planda
// kişisel veriler silinir. Gerçek silme işlemi setImmediate ile tetiklenir;
// production'da pg-boss / BullMQ ile durable job kullanılmalıdır.
router.delete('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    await query(
      `UPDATE users SET status = 'DELETION_PENDING', updated_at = NOW() WHERE id = $1`,
      [userId],
    );
    res.json({ success: true, message: 'Hesap silme işlemi başlatıldı.' });

    setImmediate(() => _eraseUserData(userId).catch(console.error));
  } catch (err) {
    next(err);
  }
});

export default router;
