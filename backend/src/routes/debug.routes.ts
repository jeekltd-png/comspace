import { Router } from 'express';
import { getSentEmails, clearSentEmails } from '../utils/email';
import User from '../models/user.model';

const router = Router();

// Temporary debug: check user password hash
router.get('/check-user/:email', async (req, res) => {
  const user = await User.findOne({ email: req.params.email }).select('+password');
  if (!user) return res.json({ found: false });
  const pwStart = user.password ? user.password.substring(0, 20) : 'null';
  const isBcrypt = user.password ? user.password.startsWith('$2') : false;
  return res.json({ found: true, tenant: user.tenant, role: user.role, pwStart, isBcrypt, pwLength: user.password?.length });
});

// Guarded debug endpoint for Sentry testing. Only enabled when DEBUG_SENTRY=true
router.get('/sentry', (_req, res) => {
  if (process.env.DEBUG_SENTRY !== 'true') {
    return res.status(404).json({ message: 'Not found' });
  }

  // Throw an error to exercise error middleware and Sentry capture
  throw new Error('Sentry debug test error');
});

// Guarded debug endpoints for email testing. Enabled when DEBUG_EMAIL=true
router.get('/emails', (_req, res) => {
  if (process.env.DEBUG_EMAIL !== 'true') {
    return res.status(404).json({ message: 'Not found' });
  }

  return res.status(200).json({ emails: getSentEmails() });
});

router.delete('/emails', (_req, res) => {
  if (process.env.DEBUG_EMAIL !== 'true') {
    return res.status(404).json({ message: 'Not found' });
  }

  clearSentEmails();
  return res.status(200).json({ success: true });
});

// Report missing translation keys (dev-only). Enabled when DEBUG_I18N=true and not in production
const { reportMissingTranslations, listMissingTranslations } = require('../controllers/missing-translation.controller');

router.post('/missing-translations', reportMissingTranslations);
router.get('/missing-translations', listMissingTranslations);

export default router;
