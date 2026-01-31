import { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user.model';
import { CustomError } from './error.middleware';

export interface AuthRequest extends Request {
  user?: IUser;
  tenant?: string;
}
export const protect: RequestHandler = async (req, _res, next) => {
  try {
    let token: string | undefined;

    const authReq = req as AuthRequest;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new CustomError('Not authorized to access this route', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; tenant: string };

    // Get user from token
    const user = await User.findById(decoded.id).select('+password');

    if (!user || !user.isActive) {
      return next(new CustomError('User not found or inactive', 401));
    }

    authReq.user = user;
    authReq.tenant = decoded.tenant || 'default';
    next();
  } catch (error) {
    return next(new CustomError('Not authorized to access this route', 401));
  }
};

export const authorize = (...roles: string[]): RequestHandler => {
  return (req, _res, next) => {
    const authReq = req as AuthRequest;
    if (!authReq.user || !roles.includes(authReq.user.role)) {
      return next(
        new CustomError(`User role '${authReq.user?.role}' is not authorized to access this route`, 403)
      );
    }
    next();
  };
};

export const generateToken = (userId: string, tenant: string = 'default'): string => {
  return jwt.sign({ id: userId, tenant }, process.env.JWT_SECRET! as jwt.Secret, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  } as jwt.SignOptions);
};

export const generateRefreshToken = (userId: string, tenant: string = 'default'): string => {
  return jwt.sign({ id: userId, tenant }, process.env.JWT_REFRESH_SECRET! as jwt.Secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  } as jwt.SignOptions);
};
