/**
 * Tests for feature-gate middleware.
 * Uses mocks for WhiteLabel model and Redis to unit-test the logic
 * without requiring real DB/cache connections.
 */

// Mock the server module to provide a fake redisClient
const mockRedisGet = jest.fn();
const mockRedisSetEx = jest.fn();
jest.mock('../server', () => ({
  redisClient: {
    get: (...args: any[]) => mockRedisGet(...args),
    setEx: (...args: any[]) => mockRedisSetEx(...args),
  },
}));

// Mock the WhiteLabel model
const mockFindOne = jest.fn();
jest.mock('../models/white-label.model', () => ({
  __esModule: true,
  default: {
    findOne: (...args: any[]) => ({
      lean: () => mockFindOne(...args),
    }),
  },
}));

import { requireFeature } from '../middleware/feature-gate.middleware';
import { Request, Response } from 'express';

const createReq = (tenant = 'test-tenant'): Partial<Request> => ({
  tenant,
} as any);

const createRes = (): Partial<Response> => ({});

describe('requireFeature middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisGet.mockResolvedValue(null);
    mockRedisSetEx.mockResolvedValue('OK');
    mockFindOne.mockResolvedValue(null);
  });

  it('should allow when feature is enabled in DB', async () => {
    mockFindOne.mockResolvedValue({
      features: { cart: true, checkout: true },
    });

    const middleware = requireFeature('cart');
    const next = jest.fn();
    await middleware(createReq() as Request, createRes() as Response, next);

    expect(next).toHaveBeenCalledWith(); // called without error
  });

  it('should allow when feature is not explicitly set (default enabled)', async () => {
    mockFindOne.mockResolvedValue({
      features: { products: true }, // cart not mentioned
    });

    const middleware = requireFeature('cart');
    const next = jest.fn();
    await middleware(createReq() as Request, createRes() as Response, next);

    // Cart is not explicitly false, so it should pass
    expect(next).toHaveBeenCalledWith();
  });

  it('should block when feature is explicitly disabled', async () => {
    mockFindOne.mockResolvedValue({
      features: { cart: false },
    });

    const middleware = requireFeature('cart');
    const next = jest.fn();
    await middleware(createReq() as Request, createRes() as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 403,
    }));
  });

  it('should block when any of multiple required features is disabled', async () => {
    mockFindOne.mockResolvedValue({
      features: { cart: true, checkout: false },
    });

    const middleware = requireFeature('cart', 'checkout');
    const next = jest.fn();
    await middleware(createReq() as Request, createRes() as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 403,
    }));
  });

  it('should use cached features from Redis when available', async () => {
    mockRedisGet.mockResolvedValue(JSON.stringify({ cart: true }));

    const middleware = requireFeature('cart');
    const next = jest.fn();
    await middleware(createReq() as Request, createRes() as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(mockFindOne).not.toHaveBeenCalled(); // DB not queried
  });

  it('should fall through to DB when Redis is unavailable', async () => {
    mockRedisGet.mockRejectedValue(new Error('Redis down'));
    mockFindOne.mockResolvedValue({
      features: { cart: true },
    });

    const middleware = requireFeature('cart');
    const next = jest.fn();
    await middleware(createReq() as Request, createRes() as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(mockFindOne).toHaveBeenCalled();
  });

  it('should cache DB result in Redis', async () => {
    mockFindOne.mockResolvedValue({
      features: { cart: true },
    });

    const middleware = requireFeature('cart');
    const next = jest.fn();
    await middleware(createReq() as Request, createRes() as Response, next);

    expect(mockRedisSetEx).toHaveBeenCalledWith(
      'tenant:features:test-tenant',
      60,
      expect.any(String)
    );
  });

  it('should allow when no config found (no tenant setup)', async () => {
    mockFindOne.mockResolvedValue(null);

    const middleware = requireFeature('cart');
    const next = jest.fn();
    await middleware(createReq() as Request, createRes() as Response, next);

    // Empty featureMap => cart is not explicitly false => pass
    expect(next).toHaveBeenCalledWith();
  });
});
