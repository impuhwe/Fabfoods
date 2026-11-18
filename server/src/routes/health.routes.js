import { Router } from 'express';
import { isDatabaseReady } from '../config/db.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

function liveness(_req, res) {
  sendSuccess(res, {
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

router.get('/', liveness);
router.get('/live', liveness);

router.get('/ready', async (req, res) => {
  const ready = await isDatabaseReady();

  if (!ready) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database is not ready',
      },
      requestId: req.id,
    });
    return;
  }

  sendSuccess(res, {
    status: 'ready',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});

export default router;
