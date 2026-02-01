import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import passport from 'passport';

// Import routes
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import currencyRoutes from './routes/currency.routes';
import locationRoutes from './routes/location.routes';
import whiteLabelRoutes from './routes/white-label.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rate-limit.middleware';
import { logger } from './utils/logger';
import { configurePassport } from './config/passport.config';
// import i18next, { i18nextMiddleware } from './config/i18n';
// import { languageMiddleware } from './middleware/language';

// Load environment variables
dotenv.config();

// Validate required env vars when running in production
const validateRequiredEnv = () => {
  if (process.env.NODE_ENV !== 'production') return;
  const required = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'FRONTEND_URL'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    logger.error(`Missing required production environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (!process.env.REDIS_URL) {
    logger.warn('REDIS_URL not set; defaulting to redis://localhost:6379');
  }
};
validateRequiredEnv();

// Initialize Sentry if configured
import { initSentry } from './utils/sentry';
initSentry();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Redis client (created at runtime to support NO_DOCKER fallback)
export let redisClient: any;

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/comspace');
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Setup in-memory services for NO_DOCKER
const setupNoDocker = async () => {
  if (process.env.NO_DOCKER === 'true') {
    // Prefer starting an in-memory MongoDB when possible. If the import fails
    // (e.g., package unavailable) or the environment explicitly requests it via
    // SKIP_MEMDB, fall back to using a local MongoDB URI and the Redis mock.
    let mongod: any = null;
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      process.env.MONGODB_URI = uri;

      // record the instance so tests can stop it
      __setMongoDInstance(mongod);
    } catch (e) {
      if (process.env.SKIP_MEMDB === 'true') {
        process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/comspace';
        // Lightweight Redis mock used in NO_DOCKER mode
        let RedisMock: any;
        try {
          // Prefer require for synchronous load to avoid late dynamic import after test teardown
          // and handle possible default export shapes
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const mod = require('./utils/redis-mock') as any;
          RedisMock = mod?.RedisMock || mod?.default || mod;
        } catch (e2) {
          // fallback to dynamic import if require fails
          const mod = await import('./utils/redis-mock') as any;
          RedisMock = mod?.RedisMock || mod?.default || mod;
        }
        redisClient = new RedisMock();
        logger.info('NO_DOCKER mode: skipped in-memory MongoDB (SKIP_MEMDB=true) and started Redis mock');
        return;
      }

      logger.warn('Failed to start in-memory MongoDB; falling back to local MongoDB URI', e);
      process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/comspace';
    }

    // Lightweight Redis mock used in NO_DOCKER mode
    let RedisMock: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('./utils/redis-mock') as any;
      RedisMock = mod?.RedisMock || mod?.default || mod;
      // Handle various module shapes and provide a local fallback if shape is unexpected
      if (typeof RedisMock !== 'function') {
        if (typeof mod === 'function') RedisMock = mod;
        else if (typeof mod?.default === 'function') RedisMock = mod.default;
        else if (typeof mod?.RedisMock?.default === 'function') RedisMock = mod.RedisMock.default;
        else {
          // Local inline fallback
          RedisMock = class {
            private store = new Map<string, string>();
            private timers = new Map<string, NodeJS.Timeout>();
            public ready = true;
            async connect(): Promise<void> { this.ready = true; }
            async quit(): Promise<void> { for (const t of this.timers.values()) clearTimeout(t); this.timers.clear(); this.store.clear(); this.ready = false; }
            async get(key: string): Promise<string | null> { return this.store.has(key) ? this.store.get(key) as string : null; }
            async set(key: string, value: string): Promise<'OK'> { this.store.set(key, value); return 'OK'; }
            async setEx(key: string, ttlSeconds: number, value: string): Promise<'OK'> { this.store.set(key, value); if (this.timers.has(key)) clearTimeout(this.timers.get(key)!); const t = setTimeout(() => { this.store.delete(key); this.timers.delete(key); }, ttlSeconds * 1000); this.timers.set(key, t); return 'OK'; }
            async del(key: string): Promise<number> { const existed = this.store.delete(key) ? 1 : 0; if (this.timers.has(key)) { clearTimeout(this.timers.get(key)!); this.timers.delete(key); } return existed; }
            async setex(key: string, ttlSeconds: number, value: string): Promise<'OK'> { return (this as any).setEx(key, ttlSeconds, value); }
          };
        }
      }
    } catch (e) {
      const mod = await import('./utils/redis-mock') as any;
      RedisMock = mod?.RedisMock || mod?.default || mod;
    }
    redisClient = new RedisMock();

    logger.info('NO_DOCKER mode: started in-memory MongoDB and Redis mock');
  } else {
    // Normal redis client
    const { createClient } = await import('redis');
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
  }
};

// Redis connection
const connectRedis = async () => {
  try {
    if (redisClient?.connect) {
      await redisClient.connect();
    } else if (redisClient?.ready) {
      // Some mock implementations may provide a ready flag
    }
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Redis connection error:', error);
  }
};

// Middleware
import { requestIdMiddleware } from './middleware/request-id.middleware';
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Serve uploaded files from /uploads in dev and production when using local storage
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request ID
app.use(requestIdMiddleware);

// Rate limiting
app.use(rateLimiter);

// Passport configuration
configurePassport(passport);
app.use(passport.initialize());

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  // read package.json to get version
  const fs = await import('fs');
  const path = await import('path');
  let version = 'unknown';
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    version = pkg.version || version;
  } catch (e) {
    // ignore
  }

  const commit = process.env.GIT_COMMIT || process.env.COMMIT_SHA || 'unknown';

  // dep statuses
  const mongoConnected = mongoose.connection?.readyState === 1;
  let redisConnected = false;
  try {
    if (redisClient) {
      redisConnected = !!redisClient.isOpen || !!redisClient.ready;
    }
  } catch (e) {
    redisConnected = false;
  }

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version,
    commit,
    deps: {
      mongo: mongoConnected,
      redis: redisConnected,
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/white-label', whiteLabelRoutes);
app.use('/api/pages', require('./routes/pages.routes').default);

// Debug routes for local development and controlled staging. Enable when
// NODE_ENV !== 'production' (local dev) OR one of DEBUG_* flags is set.
if (
  process.env.NODE_ENV !== 'production' ||
  process.env.DEBUG_SENTRY === 'true' ||
  process.env.DEBUG_EMAIL === 'true'
) {
  // require so we only load debug helpers when appropriate
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const debugRoutes = require('./routes/debug.routes').default;
  app.use('/__debug', debugRoutes);
}

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
let serverInstance: any = null;
let _mongodInstance: any = null;

const startServer = async () => {
  await setupNoDocker();
  await connectDB();
  await connectRedis();

  // In test environment we don't bind to a TCP port (supertest uses the app directly),
  // this prevents EADDRINUSE when Jest runs tests in parallel workers.
  if (process.env.NODE_ENV !== 'test') {
    serverInstance = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } else {
    logger.info('Test environment detected — not binding to network port.');
  }
};

const stopServer = async () => {
  logger.info('Stop server requested. Cleaning up...');
  try {
    if (serverInstance && serverInstance.close) {
      await new Promise<void>((resolve, reject) => serverInstance.close((err: any) => err ? reject(err) : resolve()));
      serverInstance = null;
    }
  } catch (e) {
    logger.error('Error closing server:', e);
  }

  try {
    await mongoose.connection.close();
  } catch (e) {
    logger.error('Error closing mongoose:', e);
  }

  try {
    if (redisClient && redisClient.quit) {
      await redisClient.quit();
    }
  } catch (e) {
    logger.error('Error quitting redis:', e);
  }

  try {
    if (_mongodInstance && _mongodInstance.stop) {
      await _mongodInstance.stop();
      _mongodInstance = null;
    }
  } catch (e) {
    logger.error('Error stopping in-memory mongo:', e);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await stopServer();
  process.exit(0);
});

// expose a way for tests to set the mongod instance
export const __setMongoDInstance = (inst: any) => { _mongodInstance = inst; };

// In production and dev, start automatically. In test environments we
// avoid auto-start so tests can control startup timing and avoid race
// conditions with mocked dependencies.
if (process.env.NODE_ENV !== 'test') {
  // fire-and-forget startup in non-test environments
  void startServer();
}

export { startServer, stopServer };

export default app;
