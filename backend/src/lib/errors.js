import { v4 as uuidv4 } from 'uuid';

export class AppError extends Error {
  constructor(statusCode, code, message, fieldErrors = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export const Errors = {
  notFound: (code, message) => new AppError(404, code, message),
  forbidden: () => new AppError(403, 'FORBIDDEN', 'Bu işlem için yetkiniz yok.'),
  unauthorized: () => new AppError(401, 'UNAUTHORIZED', 'Kimlik doğrulama gerekli.'),
  validation: (message, fieldErrors) => new AppError(400, 'VALIDATION_ERROR', message, fieldErrors),
  conflict: (code, message) => new AppError(409, code, message),
  domain: (code, message) => new AppError(422, code, message),
};

export function errorResponse(err, requestId) {
  return {
    error: {
      code: err.code ?? 'INTERNAL_ERROR',
      message: err.message ?? 'Beklenmeyen bir hata oluştu.',
      fieldErrors: err.fieldErrors ?? [],
      requestId,
    },
  };
}

export function generateRequestId() {
  return `req_${uuidv4().replace(/-/g, '').slice(0, 20)}`;
}
