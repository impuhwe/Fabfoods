import express from 'express';
import cookieParser from 'cookie-parser';
import env from './config/env.js';
import routes, { API_PREFIX } from './routes/index.js';
import requestId from './middleware/requestId.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { corsMiddleware } from './security/cors.js';
import { helmetMiddleware, sanitizeMiddleware } from './security/sanitize.js';
import { ensureCsrfCookie, verifyCsrf } from './security/csrf.js';
import { globalLimiter } from './security/rateLimit.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (env.TRUST_PROXY) app.set('trust proxy', 1);

  app.use(requestId);
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, _res, buffer) => {
        if (req.originalUrl.startsWith(`${API_PREFIX}/payments/webhooks/`)) {
          req.rawBody = Buffer.from(buffer);
        }
      },
    }),
  );
  app.use(cookieParser());
  app.use(globalLimiter);
  app.use(sanitizeMiddleware);
  app.use(ensureCsrfCookie);
  app.use(verifyCsrf);

  app.use(API_PREFIX, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;
