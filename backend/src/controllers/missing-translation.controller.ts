import { RequestHandler } from 'express';
import { logger } from '../utils/logger';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MissingTranslation = require('../models/missing-translation.model').default;

export const reportMissingTranslations: RequestHandler = async (req, res) => {
  // Only allow in non-production for safety by default; require DEBUG_I18N=true to enable
  if (process.env.NODE_ENV === 'production' || process.env.DEBUG_I18N !== 'true') {
    return res.status(404).json({ message: 'Not found' });
  }

  const { tenant = (req as any).tenant || 'default', locale, keys, url, userAgent, source = 'client' } = req.body;

  if (!locale || !Array.isArray(keys) || keys.length === 0) {
    return res.status(400).json({ message: 'locale and keys are required' });
  }

  try {
    const doc = await MissingTranslation.create({ tenant, locale, keys, url, userAgent, source });
    return res.status(201).json({ success: true, data: { id: doc._id } });
  } catch (err: any) {
    logger.error('[missing-translation] failed to save', err);
    return res.status(500).json({ success: false, message: 'Failed to save' });
  }
};

export const listMissingTranslations: RequestHandler = async (req, res) => {
  if (process.env.NODE_ENV === 'production' || process.env.DEBUG_I18N !== 'true') {
    return res.status(404).json({ message: 'Not found' });
  }

  const { tenant, locale, limit = 100 } = req.query;
  const q: any = {};
  if (tenant) q.tenant = tenant;
  if (locale) q.locale = locale;

  try {
    const rows = await MissingTranslation.find(q).sort({ createdAt: -1 }).limit(Number(limit));
    return res.status(200).json({ success: true, data: rows });
  } catch (err: any) {
    logger.error('[missing-translation] list failed', err);
    return res.status(500).json({ success: false, message: 'Failed to list' });
  }
};
