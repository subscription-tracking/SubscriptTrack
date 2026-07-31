import { AppError, errorResponse } from '../lib/errors.js';

export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(errorResponse(err, req.requestId));
  }

  console.error(`[${req.requestId}]`, err);

  return res.status(500).json(
    errorResponse(
      { code: 'INTERNAL_ERROR', message: 'Beklenmeyen bir hata oluştu.' },
      req.requestId,
    ),
  );
}
