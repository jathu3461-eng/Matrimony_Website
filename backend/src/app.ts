import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import prisma from './config/db';
import redis from './config/redis';
import authRoutes from './routes/auth.routes';
import referenceRoutes from './routes/reference.routes';
import profileRoutes from './routes/profile.routes';
import searchRoutes from './routes/search.routes';
import listRoutes from './routes/list.routes';
import aiRoutes from './routes/ai.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// ============================================================
// Security & Utility Middlewares
// ============================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https:'],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

app.use(cors({
  origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ============================================================
// API Routes
// ============================================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reference', referenceRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/lists', listRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);

// ============================================================
// API Health-Check Endpoint
// ============================================================
app.get('/api/health', async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch { dbStatus = 'error'; }

  try {
    const ping = await redis.ping();
    redisStatus = ping === 'PONG' ? 'connected' : 'error';
  } catch { redisStatus = 'error'; }

  const isHealthy = dbStatus === 'connected' && redisStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    services: { database: dbStatus, redis: redisStatus },
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// 404 Handler — catch unregistered routes
// ============================================================
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.method} ${req.path} not found.`, code: 'NOT_FOUND' },
  });
});

// ============================================================
// Global Error Handler
// ============================================================
app.use(errorHandler);

// ============================================================
// Bootstrap
// ============================================================
app.listen(port, () => {
  console.log(`\n🚀 Mukurtham Matrimony Backend running on http://localhost:${port}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
