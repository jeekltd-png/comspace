import { csrfProtection, setCsrfToken } from '../middleware/csrf.middleware';
import { Request, Response } from 'express';

const createReq = (
  method: string,
  cookies: Record<string, string> = {},
  headers: Record<string, string> = {},
  path = '/api/test'
): Partial<Request> => ({
  method,
  cookies,
  headers: { ...headers },
  path,
});

const createRes = (): Partial<Response> => {
  const res: any = {
    statusCode: 200,
    _cookies: {} as Record<string, any>,
    _json: null as any,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res._json = data;
      return res;
    },
    cookie(name: string, value: string, options: any) {
      res._cookies[name] = { value, options };
      return res;
    },
  };
  return res;
};

describe('CSRF middleware', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should skip safe methods (GET)', () => {
    const next = jest.fn();
    const req = createReq('GET');
    csrfProtection(req as Request, createRes() as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should skip safe methods (OPTIONS)', () => {
    const next = jest.fn();
    const req = createReq('OPTIONS');
    csrfProtection(req as Request, createRes() as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should skip in test environment', () => {
    process.env.NODE_ENV = 'test';
    const next = jest.fn();
    const req = createReq('POST');
    csrfProtection(req as Request, createRes() as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should skip webhook routes', () => {
    const next = jest.fn();
    const req = createReq('POST', {}, {}, '/api/payments/webhook');
    csrfProtection(req as Request, createRes() as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reject POST without CSRF token', () => {
    process.env.NODE_ENV = 'development';
    const next = jest.fn();
    const res = createRes();
    const req = createReq('POST');
    csrfProtection(req as Request, res as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect((res as any).statusCode).toBe(403);
    expect((res as any)._json.message).toContain('CSRF');
  });

  it('should reject POST with mismatched tokens', () => {
    process.env.NODE_ENV = 'development';
    const next = jest.fn();
    const res = createRes();
    const req = createReq(
      'POST',
      { 'csrf-token': 'token-a' },
      { 'x-csrf-token': 'token-b' }
    );
    csrfProtection(req as Request, res as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect((res as any).statusCode).toBe(403);
  });

  it('should accept POST with matching tokens', () => {
    process.env.NODE_ENV = 'development';
    const next = jest.fn();
    const req = createReq(
      'POST',
      { 'csrf-token': 'valid-token' },
      { 'x-csrf-token': 'valid-token' }
    );
    csrfProtection(req as Request, createRes() as Response, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('setCsrfToken', () => {
  it('should set a cookie and return the token', () => {
    const res = createRes();
    setCsrfToken({} as Request, res as Response);
    expect((res as any)._cookies['csrf-token']).toBeDefined();
    expect((res as any)._cookies['csrf-token'].value).toHaveLength(64); // 32 bytes hex
    expect((res as any)._json.csrfToken).toBe((res as any)._cookies['csrf-token'].value);
  });
});
