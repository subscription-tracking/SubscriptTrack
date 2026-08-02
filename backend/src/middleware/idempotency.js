import { query } from '../config/db.js';

// Purge expired keys once per process start — best-effort, non-blocking.
query('DELETE FROM idempotency_keys WHERE expires_at < NOW()').catch(() => {});

export async function idempotency(req, res, next) {
  const key = req.headers['idempotency-key'];
  if (!key) return next();

  const cacheKey = `${req.userId}:${req.method}:${req.path}:${key}`;

  // Look up an existing (non-expired) response from the DB.
  const { rows } = await query(
    `SELECT status_code, response_body
     FROM idempotency_keys
     WHERE cache_key = $1 AND expires_at > NOW()`,
    [cacheKey],
  ).catch(() => ({ rows: [] }));

  if (rows.length) {
    return res.status(rows[0].status_code).json(rows[0].response_body);
  }

  // Intercept the outgoing JSON to persist a successful response.
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode < 300) {
      query(
        `INSERT INTO idempotency_keys (cache_key, status_code, response_body)
         VALUES ($1, $2, $3)
         ON CONFLICT (cache_key) DO NOTHING`,
        [cacheKey, res.statusCode, body],
      ).catch(() => {});
    }
    return originalJson(body);
  };

  next();
}
