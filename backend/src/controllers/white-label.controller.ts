import { RequestHandler } from 'express';
import WhiteLabel from '../models/white-label.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';

export const getWhiteLabelConfig: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const config = await WhiteLabel.findOne({ tenantId: authReq.tenant, isActive: true });

    if (!config) {
      return next(new CustomError('White label configuration not found', 404));
    }

    res.status(200).json({ success: true, data: { config } });
  } catch (error) {
    next(error);
  }
};

// Allowed fields for white-label configuration
const ALLOWED_WL_FIELDS = [
  'tenantId', 'name', 'domain', 'branding', 'features',
  'payment', 'contact', 'social', 'seo', 'customCSS', 'isActive',
] as const;

const pickFields = <T extends Record<string, any>>(obj: T, fields: readonly string[]): Partial<T> => {
  const result: Partial<T> = {};
  for (const key of fields) {
    if (key in obj) {
      (result as any)[key] = obj[key];
    }
  }
  return result;
};

export const createWhiteLabelConfig: RequestHandler = async (req, res, next) => {
  try {
    const sanitized = pickFields(req.body, ALLOWED_WL_FIELDS as unknown as string[]);
    const config = await WhiteLabel.create(sanitized);

    res.status(201).json({ success: true, data: { config } });
  } catch (error) {
    next(error);
  }
};

const UPDATABLE_WL_FIELDS = [
  'name', 'domain', 'branding', 'features',
  'payment', 'contact', 'social', 'seo', 'customCSS', 'isActive',
] as const;

export const updateWhiteLabelConfig: RequestHandler = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const sanitized = pickFields(req.body, UPDATABLE_WL_FIELDS as unknown as string[]);

    const config = await WhiteLabel.findOneAndUpdate({ tenantId }, sanitized, {
      new: true,
      runValidators: true,
    });

    if (!config) {
      return next(new CustomError('Configuration not found', 404));
    }

    res.status(200).json({ success: true, data: { config } });
  } catch (error) {
    next(error);
  }
};
