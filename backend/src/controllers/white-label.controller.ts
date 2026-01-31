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

export const createWhiteLabelConfig: RequestHandler = async (req, res, next) => {
  try {
    const config = await WhiteLabel.create(req.body);

    res.status(201).json({ success: true, data: { config } });
  } catch (error) {
    next(error);
  }
};

export const updateWhiteLabelConfig: RequestHandler = async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    const config = await WhiteLabel.findOneAndUpdate({ tenantId }, req.body, {
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
