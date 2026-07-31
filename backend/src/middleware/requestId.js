import { generateRequestId } from '../lib/errors.js';

export function requestIdMiddleware(req, res, next) {
  req.requestId = generateRequestId();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}
