import { sanitizeInputs } from '../middleware/sanitize.middleware';
import { Request, Response, NextFunction } from 'express';

// Helper to create mock express objects
const mockReq = (body: any = {}, query: any = {}, params: any = {}): Partial<Request> => ({
  body,
  query,
  params,
});

const mockRes = (): Partial<Response> => ({});

const mockNext: NextFunction = jest.fn();

describe('sanitizeInputs middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call next()', () => {
    const req = mockReq({ name: 'John' });
    sanitizeInputs(req as Request, mockRes() as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should strip <script> tags from body', () => {
    const req = mockReq({
      name: 'John<script>alert("xss")</script>',
      bio: 'Hello world',
    });
    sanitizeInputs(req as Request, mockRes() as Response, mockNext);
    expect(req.body.name).toBe('John');
    expect(req.body.bio).toBe('Hello world');
  });

  it('should strip event handlers', () => {
    const req = mockReq({
      desc: 'Nice product <img onerror="alert(1)" src="x">',
    });
    sanitizeInputs(req as Request, mockRes() as Response, mockNext);
    expect(req.body.desc).not.toContain('onerror');
  });

  it('should strip javascript: URIs', () => {
    const req = mockReq({
      link: 'javascript:alert(1)',
    });
    sanitizeInputs(req as Request, mockRes() as Response, mockNext);
    expect(req.body.link).not.toContain('javascript:');
  });

  it('should strip iframe tags', () => {
    const req = mockReq({
      content: 'Hello <iframe src="evil.com"></iframe> world',
    });
    sanitizeInputs(req as Request, mockRes() as Response, mockNext);
    expect(req.body.content).not.toContain('<iframe');
    expect(req.body.content).toContain('Hello');
    expect(req.body.content).toContain('world');
  });

  it('should sanitize nested objects', () => {
    const req = mockReq({
      user: {
        name: '<script>evil</script>John',
        address: {
          city: 'Tokyo<iframe src="x"></iframe>',
        },
      },
    });
    sanitizeInputs(req as Request, mockRes() as Response, mockNext);
    expect(req.body.user.name).toBe('John');
    expect(req.body.user.address.city).toBe('Tokyo');
  });

  it('should sanitize arrays', () => {
    const req = mockReq({
      tags: ['safe', '<script>alert(1)</script>evil'],
    });
    sanitizeInputs(req as Request, mockRes() as Response, mockNext);
    expect(req.body.tags[0]).toBe('safe');
    expect(req.body.tags[1]).toBe('evil');
  });

  it('should leave non-string values untouched', () => {
    const req = mockReq({
      count: 42,
      active: true,
      nothing: null,
    });
    sanitizeInputs(req as Request, mockRes() as Response, mockNext);
    expect(req.body.count).toBe(42);
    expect(req.body.active).toBe(true);
    expect(req.body.nothing).toBeNull();
  });

  it('should sanitize query params', () => {
    const req = mockReq({}, { search: '<script>x</script>test' });
    sanitizeInputs(req as Request, mockRes() as Response, mockNext);
    expect(req.query!.search).toBe('test');
  });

  it('should allow legitimate image data URIs', () => {
    const req = mockReq({
      avatar: 'data:image/png;base64,abc123',
    });
    sanitizeInputs(req as Request, mockRes() as Response, mockNext);
    expect(req.body.avatar).toContain('data:image/png');
  });
});
