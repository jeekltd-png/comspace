import { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user.model';
import { CustomError } from './error.middleware';
import { redisClient } from '../server';

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

    // Check if token is blacklisted (logged-out)
    try {
      if (redisClient) {
        const blacklisted = await redisClient.get(`bl:${token}`);
        if (blacklisted) {
          return next(new CustomError('Token has been revoked', 401));
        }
      }
    } catch (_) {
      // If Redis is down, skip blacklist check rather than block all auth
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(new CustomError('Server configuration error', 500));
    }
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as { id: string; tenant: string };

    // Get user from token (no need to load password hash on every request)
    const user = await User.findById(decoded.id);

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
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return jwt.sign({ id: userId, tenant }, secret as jwt.Secret, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
    algorithm: 'HS256',
  } as jwt.SignOptions);
};

export const generateRefreshToken = (userId: string, tenant: string = 'default'): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET is not configured');
  return jwt.sign({ id: userId, tenant }, secret as jwt.Secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
    algorithm: 'HS256',
  } as jwt.SignOptions);
};
