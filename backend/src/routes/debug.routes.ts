import { Router } from 'express';
import { getSentEmails, clearSentEmails } from '../utils/email';

const router = Router();

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

// Development helper: create or patch an admin user and return auth tokens.
// Enabled when not running in production to avoid accidental exposure.
router.post('/create-admin', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' });
  }

  const { email, password, role = 'admin', firstName = 'Dev', lastName = 'Admin', tenant = 'default' } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'email and password required' });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const User = require('../models/user.model').default;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { generateToken, generateRefreshToken } = require('../middleware/auth.middleware');

  let user = await User.findOne({ email, tenant });
  if (!user) {
    user = await User.create({ email, password, role, firstName, lastName, tenant, isVerified: true });
  } else {
    user.password = password;
    user.role = role;
    user.firstName = firstName;
    user.lastName = lastName;
    user.tenant = tenant;
    await user.save({ validateBeforeSave: false });
  }

  const token = generateToken(user._id.toString(), tenant);
  const refreshToken = generateRefreshToken(user._id.toString(), tenant);

  return res.status(200).json({ success: true, data: { user: { id: user._id, email: user.email, role: user.role }, token, refreshToken } });
});

// Report missing translation keys (dev-only). Enabled when DEBUG_I18N=true and not in production
const { reportMissingTranslations, listMissingTranslations } = require('../controllers/missing-translation.controller');

router.post('/missing-translations', reportMissingTranslations);
router.get('/missing-translations', listMissingTranslations);

export default router;
