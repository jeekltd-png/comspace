import { Router } from 'express';

const router = Router();

// Guarded debug endpoint for Sentry testing. Only enabled when DEBUG_SENTRY=true
router.get('/sentry', (_req, res) => {
  if (process.env.DEBUG_SENTRY !== 'true') {
    return res.status(404).json({ message: 'Not found' });
  }

  // Throw an error to exercise error middleware and Sentry capture
  throw new Error('Sentry debug test error');
});

export default router;
