import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import env from '../config/env.js';

export const helmetMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'no-referrer' },
});

export const sanitizeMiddleware = [mongoSanitize({ replaceWith: '_', allowDots: false }), hpp()];

export const isProduction = env.isProduction;
