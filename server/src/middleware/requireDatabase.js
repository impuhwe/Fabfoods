import mongoose from 'mongoose';
import { serviceUnavailable } from '../utils/errors.js';

export function requireDatabase(_req, _res, next) {
  if (mongoose.connection.readyState !== 1) {
    return next(
      serviceUnavailable(
        'Menu data is temporarily unavailable. Please try again shortly.',
        'DATABASE_UNAVAILABLE',
      ),
    );
  }

  return next();
}

export default requireDatabase;
