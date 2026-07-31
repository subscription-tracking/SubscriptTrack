import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/db.js';
import { Errors } from '../../lib/errors.js';

const router = Router();

// POST /exports — asenkron export başlatır
router.post('/', async (req, res, next) => {
  try {
    const id = uuidv4();

    // Gerçek implementasyonda bu bir job queue'ya gönderilir.
    // Şimdilik DB'de PENDING kaydı açıp döndürüyoruz.
    await query(
      `INSERT INTO exports (id, user_id, status, created_at)
       VALUES ($1, $2, 'PENDING', NOW())`,
      [id, req.userId],
    );

    res.status(202).json({ id, status: 'PENDING' });
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
