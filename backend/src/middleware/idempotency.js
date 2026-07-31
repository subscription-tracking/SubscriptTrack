import { query } from '../config/db.js';

const cache = new Map();

export async function idempotency(req, res, next) {
  const key = req.headers['idempotency-key'];
  if (!key) return next();

  const cacheKey = `${req.userId}:${req.method}:${req.path}:${key}`;

  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    return res.status(cached.status).json(cached.body);
  }

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode < 300) {
      cache.set(cacheKey, { status: res.statusCode, body });
      setTimeout(() => cache.delete(cacheKey), 24 * 60 * 60 * 1000);
    }
    return originalJson(body);
  };

  next();
}
