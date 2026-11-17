export class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export const badRequest = (message, details) =>
  new AppError(400, 'VALIDATION_ERROR', message, details);

export const unauthenticated = (message = 'Authentication required', code = 'UNAUTHENTICATED') =>
  new AppError(401, code, message);

export const invalidCredentials = () =>
  new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');

export const forbidden = (message = 'You do not have permission to do that', code = 'FORBIDDEN') =>
  new AppError(403, code, message);

export const notFound = (message = 'The requested resource was not found') =>
  new AppError(404, 'NOT_FOUND', message);

export const conflict = (message, code = 'CONFLICT') => new AppError(409, code, message);

export const tooManyRequests = (message = 'Too many requests, please try again later') =>
  new AppError(429, 'RATE_LIMITED', message);

export const serviceUnavailable = (
  message = 'Service temporarily unavailable',
  code = 'SERVICE_UNAVAILABLE',
) => new AppError(503, code, message);

export const internalError = (message = 'Something went wrong') =>
  new AppError(500, 'INTERNAL_ERROR', message);
