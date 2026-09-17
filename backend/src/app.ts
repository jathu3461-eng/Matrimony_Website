import dotenv from 'dotenv';
dotenv.config(); // MUST be first — loads env vars before any config module (e.g. redis) reads them

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';

import prisma from './config/db';
import redis from './config/redis';
import authRoutes from './routes/auth.routes';
import referenceRoutes from './routes/reference.routes';
import profileRoutes from './routes/profile.routes';
import searchRoutes from './routes/search.routes';
import listRoutes from './routes/list.routes';
import aiRoutes from './routes/ai.routes';
import paymentRoutes from './routes/payment.routes';
import matchRoutes from './routes/match.routes';
import adminRoutes from './routes/admin.routes';
import brokerRoutes from './routes/broker.routes';
import interestRoutes from './routes/interest.routes';
import conversationRoutes from './routes/conversation.routes';
import notificationRoutes from './routes/notification.routes';
import { errorHandler } from './middleware/error.middleware';

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
app.use('/api/v1/matches', matchRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/broker', brokerRoutes);
app.use('/api/v1/interests', interestRoutes);
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// ============================================================
// Aliases without /v1/ prefix (frontend uses /api/ base)
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/reference', referenceRoutes);
app.use('/api/profiles/search', searchRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/broker', brokerRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/notifications', notificationRoutes);

// ============================================================
// ONE-TIME Admin Setup Endpoint (secret-key protected)
// ============================================================
app.post('/api/v1/setup/make-admin', express.json(), async (req: Request, res: Response) => {
  const SETUP_SECRET = 'mukurtham_setup_9k2x7p4q';
  const { secret, email } = req.body;

  if (secret !== SETUP_SECRET) {
    res.status(403).json({ success: false, error: 'Invalid setup secret.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ success: false, error: `No user found with email: ${email}` });
      return;
    }

    // Update accountType to admin
    await prisma.user.update({
      where: { email },
      data: { accountType: 'admin' as any },
    });

    // Upsert admin role
    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: { name: 'admin' },
    });

    // Assign admin role to user
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
      update: {},
      create: { userId: user.id, roleId: adminRole.id },
    });

    res.json({ success: true, message: `User ${email} has been granted admin role.` });
  } catch (err: any) {
    console.error('[Setup] make-admin error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// DB Connection Test Endpoint (debug only)
// ============================================================
app.get('/api/v1/setup/test-db', async (req: Request, res: Response) => {
  const dbUrl = process.env.DATABASE_URL || 'NOT SET';
  // Mask password in URL for safety
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
  try {
    await prisma.$queryRaw`SELECT 1 AS ok`;
    res.json({ success: true, message: 'Database connected!', url: maskedUrl });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, url: maskedUrl });
  }
});

// Root route required for cPanel Node.js Selector availability check
app.get(['/', '/api'], (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json({
    status: 'ok',
    name: 'Mukurtham Matrimony API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

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
// Static uploads (legacy media served from the old backend folder)
// ============================================================
app.use('/uploads', express.static('/home/mukutmzw/mukurtham-backend/uploads'));

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
// Seed default admin account on startup if not present
const seedAdmin = async () => {
  try {
    const adminEmail = 'matrimony2026@gmail.com';
    const existingUser = await prisma.user.findFirst({
      where: { email: adminEmail }
    });
    if (!existingUser) {
      console.log('🌱 Admin account not found. Seeding admin account (matrimony2026@gmail.com)...');
      const hashedPassword = bcrypt.hashSync('Matrimony2026@', 12);
      
      const user = await prisma.user.create({
        data: {
          username: 'admin',
          email: adminEmail,
          password: hashedPassword,
          phoneNumber: '0770000000',
          accountType: 'admin' as any,
        }
      });

      // Upsert admin role
      const adminRole = await prisma.role.upsert({
        where: { name: 'admin' },
        update: {},
        create: { name: 'admin', isSystem: true },
      });

      // Assign admin role to user
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
        update: {},
        create: { userId: user.id, roleId: adminRole.id },
      });
      console.log('✔ Default Admin Account successfully seeded!');
    } else {
      // Ensure existing account has correct password hash (in case they modified it)
      const isPasswordCorrect = bcrypt.compareSync('Matrimony2026@', existingUser.password);
      if (!isPasswordCorrect) {
        console.log('🌱 Correcting password for matrimony2026@gmail.com...');
        await prisma.user.update({
          where: { email: adminEmail },
          data: {
            password: bcrypt.hashSync('Matrimony2026@', 12),
            accountType: 'admin' as any
          }
        });
      }
    }
  } catch (err) {
    console.error('❌ Error seeding default admin:', err);
  }
};

app.listen(port, async () => {
  await seedAdmin();
  console.log(`\n🚀 Mukurtham Matrimony Backend running on http://localhost:${port}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
