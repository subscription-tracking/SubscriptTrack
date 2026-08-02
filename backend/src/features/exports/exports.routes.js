import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/db.js';
import { Errors } from '../../lib/errors.js';

// Generates a CSV string from a user's subscriptions and marks the export row
// as COMPLETED with an inline data URL (no external storage dependency).
async function _processExport(exportId, userId) {
  try {
    const { rows } = await query(
      `SELECT s.name, bs.amount, bs.currency, bs.cycle,
              c.code AS category_code, s.status,
              bs.next_renewal_at, s.note
       FROM subscriptions s
       JOIN billing_schedules bs ON bs.subscription_id = s.id
       JOIN categories c ON c.id = s.category_id
       WHERE s.user_id = $1
       ORDER BY bs.next_renewal_at ASC`,
      [userId],
    );

    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [
      ['Ad', 'Tutar', 'Para Birimi', 'Döngü', 'Kategori', 'Durum', 'Sonraki Yenileme', 'Notlar']
        .map(escape).join(','),
      ...rows.map((r) =>
        [r.name, r.amount, r.currency, r.cycle, r.category_code, r.status,
          r.next_renewal_at ? new Date(r.next_renewal_at).toISOString().slice(0, 10) : '',
          r.note ?? ''].map(escape).join(','),
      ),
    ];
    const csv = lines.join('\r\n');

    // Encode as a data URL so the client can download without external storage.
    const dataUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await query(
      `UPDATE exports SET status = 'COMPLETED', download_url = $2, expires_at = $3, updated_at = NOW()
       WHERE id = $1`,
      [exportId, dataUrl, expiresAt],
    );
  } catch (err) {
    await query(
      `UPDATE exports SET status = 'FAILED', updated_at = NOW() WHERE id = $1`,
      [exportId],
    ).catch(() => {});
    throw err;
  }
}

const router = Router();

// POST /exports — asenkron CSV export başlatır ve arka planda işler.
router.post('/', async (req, res, next) => {
  try {
    const id = uuidv4();

    await query(
      `INSERT INTO exports (id, user_id, status, created_at, updated_at)
       VALUES ($1, $2, 'PENDING', NOW(), NOW())`,
      [id, req.userId],
    );

    res.status(202).json({ id, status: 'PENDING' });

    // Fire-and-forget: process the export in the background.
    // In a production setup with multiple instances this should be a durable
    // job queue (pg-boss, BullMQ). Until then the current process handles it.
    setImmediate(() => _processExport(id, req.userId).catch(console.error));
  } catch (err) {
    next(err);
  }
});

// GET /exports/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, status, download_url, expires_at, created_at
       FROM exports
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );

    if (!rows.length) return next(Errors.notFound('EXPORT_NOT_FOUND', 'Export bulunamadı.'));

    const r = rows[0];
    res.json({
      id: r.id,
      status: r.status,
      downloadUrl: r.download_url,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
