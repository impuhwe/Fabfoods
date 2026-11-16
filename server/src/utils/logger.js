import env from '../config/env.js';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const REDACTED_KEYS = /password|token|secret|authorization|cookie|pepper/i;

function sanitize(value, depth = 0) {
  if (depth > 4 || value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => sanitize(item, depth + 1));
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      REDACTED_KEYS.test(key) ? '[redacted]' : sanitize(item, depth + 1),
    ]),
  );
}

function write(level, message, meta) {
  if (LEVELS[level] < LEVELS[env.LOG_LEVEL]) return;

  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta: sanitize(meta) } : {}),
  };

  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  console.log(line);
}

const logger = {
  debug: (message, meta) => write('debug', message, meta),
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
};

export default logger;
