import { requestLogger } from '../middleware/request-logger.middleware';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const createReq = (method = 'GET', url = '/api/test'): Partial<Request> => ({
  method,
  originalUrl: url,
  url,
  ip: '127.0.0.1',
  socket: { remoteAddress: '127.0.0.1' } as any,
  headers: { 'user-agent': 'jest-test' },
  get: jest.fn().mockReturnValue('jest-test'),
});

const createRes = (statusCode = 200): Partial<Response> => {
  const listeners: Record<string, Function[]> = {};
  return {
    statusCode,
    on(event: string, handler: Function) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
      return this as any;
    },
    get: jest.fn().mockReturnValue('42'),
    // Helper to trigger events
    emit(event: string) {
      listeners[event]?.forEach((fn) => fn());
      return true;
    },
  } as any;
};

describe('requestLogger middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call next immediately', () => {
    const next = jest.fn();
    const req = createReq();
    const res = createRes();
    requestLogger(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should log info on 200 response', () => {
    const next = jest.fn();
    const req = createReq();
    const res = createRes(200);
    requestLogger(req as Request, res as Response, next);
    // Simulate response finish
    (res as any).emit('finish');
    expect(logger.info).toHaveBeenCalledWith('Request completed', expect.objectContaining({
      method: 'GET',
      statusCode: 200,
    }));
  });

  it('should log warn on 404 response', () => {
    const next = jest.fn();
    const req = createReq();
    const res = createRes(404);
    requestLogger(req as Request, res as Response, next);
    (res as any).emit('finish');
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should log error on 500 response', () => {
    const next = jest.fn();
    const req = createReq();
    const res = createRes(500);
    requestLogger(req as Request, res as Response, next);
    (res as any).emit('finish');
    expect(logger.error).toHaveBeenCalled();
  });
});
