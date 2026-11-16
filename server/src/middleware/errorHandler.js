import mongoose from 'mongoose';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import { AppError, badRequest } from '../utils/errors.js';

export function notFoundHandler(req, _res, next) {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} was not found`));
}

export function errorHandler(error, req, res, _next) {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong';
  let details;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Request body must be valid JSON';
  } else if (error?.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    message = 'That value is already in use';
  } else if (error?.name === 'ValidationError' && error instanceof mongoose.Error) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Please check the submitted fields';
  }

  if (statusCode >= 500) {
    logger.error('Unhandled request error', {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      error,
    });
  }

  const body = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    requestId: req.id,
  };

  if (env.isDevelopment && statusCode >= 500) {
    body.error.debug = { name: error.name };
  }

  res.status(statusCode).json(body);
}

export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function assertObjectId(value, label = 'identifier') {
  if (!mongoose.isValidObjectId(value)) throw badRequest(`Invalid ${label}`);
  return value;
}
