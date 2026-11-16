import cors from 'cors';
import env from '../config/env.js';
import { AppError } from '../utils/errors.js';

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin || env.clientOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new AppError(403, 'CORS_ORIGIN_DENIED', 'Origin is not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Request-Id', 'Idempotency-Key'],
  exposedHeaders: ['X-Request-Id', 'RateLimit', 'RateLimit-Policy'],
  maxAge: 600,
  optionsSuccessStatus: 204,
});

export default corsMiddleware;
