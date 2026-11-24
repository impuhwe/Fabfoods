import env from './config/env.js';
import { connectToDatabase, disconnectFromDatabase } from './config/db.js';
import app from './app.js';
import dns from 'node:dns';
import logger from './utils/logger.js';

let server;

async function start() {
  await connectToDatabase();

  server = app.listen(env.PORT, () => {
    logger.info('API listening', { port: env.PORT, environment: env.NODE_ENV });
  });

  server.on('error', (error) => {
    logger.error('HTTP server error', { message: error.message });
  });
}

async function shutdown(signal) {
  logger.info('Shutting down', { signal });

  if (server) {
    await new Promise((resolve) => {
      server.close(() => resolve());
      setTimeout(resolve, 10_000).unref();
    });
  }

  await disconnectFromDatabase();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    message: reason instanceof Error ? reason.message : String(reason),
  });
});
// Work around unreliable local DNS resolution for MongoDB Atlas in development.
if (env.isDevelopment) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

start().catch((error) => {
  logger.error('Failed to start API', { message: error.message });
  process.exit(1);
});
