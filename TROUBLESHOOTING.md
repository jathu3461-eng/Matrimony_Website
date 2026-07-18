# 🆘 TROUBLESHOOTING GUIDE - Mukurtham Matrimony

Comprehensive solutions to common issues you might encounter.

---

## 🔧 Installation & Setup Issues

### ❌ "npm ERR! code ERESOLVE"

**Problem:** npm dependency resolution conflict

**Solution:**
```bash
# Option 1: Use legacy peer deps
npm install --legacy-peer-deps

# Option 2: Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Option 3: Use Node 18+
node --version  # Should be 18 or higher
```

---

### ❌ "Node Sass binding error"

**Problem:** Native dependency build failure

**Solution:**
```bash
# Rebuild native modules
npm rebuild

# Or reinstall
rm -rf node_modules
npm install
```

---

### ❌ "Cannot find module '@prisma/client'"

**Problem:** Prisma client not generated

**Solution:**
```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Verify installation
npm list @prisma/client
```

---

## 🗄️ Database Issues

### ❌ "Connection refused on port 3306"

**Problem:** MySQL not running

**Solution:**
```bash
# Check if container is running
docker-compose -f infrastructure/docker-compose.yml ps

# If not running, start it
docker-compose -f infrastructure/docker-compose.yml up -d

# Verify MySQL is accessible
mysql -u root -p -h 127.0.0.1 -P 3306

# Or with Docker
docker exec -it mukurtham-mysql mysql -u root -p -e "SELECT 1"
```

---

### ❌ "Prisma migration failed"

**Problem:** Migration errors during database setup

**Solution:**
```bash
cd backend

# Check migration status
npm run prisma:migrate -- --help

# Reset database (WARNING: deletes all data)
npm run prisma:migrate -- reset

# If stuck, manually check:
npm run prisma:generate
npm run prisma:migrate -- deploy

# Check database logs
docker logs mukurtham-mysql
```

---

### ❌ "MYSQL_ERROR: Access denied for user"

**Problem:** Wrong database credentials

**Solution:**
```bash
# Check backend/.env
cat backend/.env | grep DATABASE_URL

# Should match docker-compose credentials:
# MYSQL_USER: mukurtham_user
# MYSQL_PASSWORD: mukurtham_password

# Update if needed:
# DATABASE_URL="mysql://mukurtham_user:mukurtham_password@localhost:3306/mukurtham_matrimony"

# Restart containers
docker-compose -f infrastructure/docker-compose.yml down
docker-compose -f infrastructure/docker-compose.yml up -d
```

---

### ❌ "Database already exists"

**Problem:** Tables already initialized

**Solution:**
```bash
cd backend

# Drop and recreate (WARNING: data loss)
npm run prisma:migrate -- reset

# Or manually drop database
docker exec mukurtham-mysql mysql -u root -p -e "DROP DATABASE mukurtham_matrimony;"
docker exec mukurtham-mysql mysql -u root -p -e "CREATE DATABASE mukurtham_matrimony;"

# Run migrations again
npm run prisma:migrate
```

---

## ⚙️ Server & Port Issues

### ❌ "Port 8000 is already in use"

**Problem:** Backend port conflict

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000
# or on Windows
netstat -ano | findstr :8000

# Kill process
kill -9 <PID>
# or on Windows
taskkill /PID <PID> /F

# Or change port in backend/.env
PORT=8001

# Then update frontend/.env
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
```

---

### ❌ "Port 3000 is already in use"

**Problem:** Frontend port conflict

**Solution:**
```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>

# Or change port in next.config.ts
// next.config.ts
module.exports = {
  experimental: { turbopack: {} },
  server: { port: 3001 }
}

# Run on different port
npm run dev -- -p 3001
```

---

### ❌ "Backend not responding / timeout"

**Problem:** Backend server crashed or not running

**Solution:**
```bash
# Check if backend is running
curl http://localhost:8000/api/health

# If error, restart backend
cd backend
npm run dev

# Check logs for errors
# Look for stack traces in terminal output
```

---

## 🔐 Authentication Issues

### ❌ "Unauthorized / Invalid token"

**Problem:** JWT token expired or invalid

**Solution:**
```typescript
// Frontend - Handle token refresh
const response = await apiClient.login(email, password);
if (response.success) {
  // Store token
  localStorage.setItem('accessToken', response.data.accessToken);
  localStorage.setItem('refreshToken', response.data.refreshToken);
}

// Auto-refresh on 401
if (response.error?.code === 'UNAUTHORIZED') {
  const refreshed = await apiClient.refreshToken(refreshToken);
  if (refreshed.success) {
    localStorage.setItem('accessToken', refreshed.data.accessToken);
  }
}
```

---

### ❌ "Missing JWT_SECRET"

**Problem:** Environment variable not set

**Solution:**
```bash
# Verify backend/.env has JWT_SECRET
cat backend/.env | grep JWT_SECRET

# If missing, add it
echo 'JWT_SECRET="your-super-secret-key-9876543210"' >> backend/.env

# Regenerate with strong value
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🌐 CORS Issues

### ❌ "CORS policy: Cross-Origin Request Blocked"

**Problem:** Frontend can't communicate with backend

**Solution:**
```bash
# Check backend CORS configuration
cat backend/.env | grep CLIENT_ORIGIN

# Update if needed:
CLIENT_ORIGIN="http://localhost:3000,http://localhost:3001"

# For production:
CLIENT_ORIGIN="https://yourdomain.com"

# Restart backend
npm run dev
```

**Also check backend/src/app.ts:**
```typescript
app.use(cors({
  origin: process.env.CLIENT_ORIGIN ? 
    process.env.CLIENT_ORIGIN.split(',') : 
    'http://localhost:3000',
  credentials: true,
}));
```

---

### ❌ "OPTIONS request returns 404"

**Problem:** CORS preflight request failing

**Solution:**
```bash
# Ensure Express is configured for OPTIONS
# backend/src/app.ts should have:
app.use(cors({ /* options */ }));

# Add explicit OPTIONS handler if needed
app.options('*', cors());

# Restart backend
```

---

## 🎨 Frontend Issues

### ❌ "Styles not loading / TailwindCSS not working"

**Problem:** CSS build issues

**Solution:**
```bash
cd frontend

# Clear build cache
rm -rf .next

# Rebuild
npm run build

# Or in dev mode
npm run dev

# Check if postcss.config.mjs exists
ls -la postcss.config.mjs
ls -la tailwind.config.ts
```

---

### ❌ "Module not found: Can't resolve '@/...'

**Problem:** Path alias not working

**Solution:**
```bash
# Check tsconfig.json paths
cat frontend/tsconfig.json

# Should have:
# "paths": {
#   "@/*": ["./*"]
# }

# Clear Next.js cache and rebuild
rm -rf .next
npm run dev
```

---

### ❌ "Hydration error / Text content mismatch"

**Problem:** Server-side and client-side rendering difference

**Solution:**
```typescript
'use client';

import { useEffect, useState } from 'react';

export default function Component() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;  // Prevent hydration mismatch

  return <div>{/* content */}</div>;
}
```

---

## 🔄 Redis Issues

### ❌ "Redis connection refused"

**Problem:** Redis not running

**Solution:**
```bash
# Check if Redis container is running
docker-compose -f infrastructure/docker-compose.yml ps

# Start Redis
docker-compose -f infrastructure/docker-compose.yml up -d redis

# Test Redis connection
docker exec mukurtham-redis redis-cli ping
# Should return: PONG
```

---

### ❌ "Redis memory exceeded"

**Problem:** Redis cache full

**Solution:**
```bash
# Check Redis memory usage
docker exec mukurtham-redis redis-cli info memory

# Clear all Redis data
docker exec mukurtham-redis redis-cli FLUSHALL

# Set maximum memory policy
docker exec mukurtham-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## 📧 Email Issues

### ❌ "Email not sending / SMTP error"

**Problem:** Email service not configured

**Solution:**
```bash
# Check Gmail SMTP credentials in backend/.env
cat backend/.env | grep NODEMAILER

# If using Gmail, create app password:
# 1. Go to https://myaccount.google.com/security
# 2. Enable 2-factor authentication
# 3. Create app password for Mail
# 4. Update backend/.env:

NODEMAILER_USER="your-email@gmail.com"
NODEMAILER_PASS="your-16-char-app-password"
NODEMAILER_FROM="your-email@gmail.com"

# Test email service
# Add test endpoint in backend and verify
```

---

## 🐳 Docker Issues

### ❌ "Docker daemon not running"

**Problem:** Docker service stopped

**Solution:**
```bash
# Mac/Linux - Start Docker daemon
sudo systemctl start docker
# or
open -a Docker

# Windows - Start Docker Desktop

# Verify
docker --version
docker ps
```

---

### ❌ "Container keeps crashing"

**Problem:** Application error in container

**Solution:**
```bash
# Check logs
docker-compose -f infrastructure/docker-compose.yml logs backend
docker-compose -f infrastructure/docker-compose.yml logs frontend

# Rebuild container
docker-compose -f infrastructure/docker-compose.yml build --no-cache

# Restart
docker-compose -f infrastructure/docker-compose.yml restart
```

---

## 🚀 Performance Issues

### ❌ "Application running slow"

**Problem:** Performance degradation

**Solution:**
```bash
# Clear browser cache
# DevTools > Application > Clear storage

# Check frontend bundle size
cd frontend
npm run build
# Check .next/static/

# Optimize images
# Use Next.js Image component for optimization

# Backend - Check logs for slow queries
# Enable query logging in backend/.env
NODE_ENV=debug

# Check database indexes
# See DEPLOYMENT.md for optimization tips
```

---

## 📊 Testing Issues

### ❌ "Tests failing / timeout"

**Problem:** Test environment not set up

**Solution:**
```bash
cd backend

# Run tests
npm test

# If timeout, increase timeout:
npm test -- --testTimeout=10000

# Run single test
npm test -- auth.controller.test.ts

# Debug test
npm test -- --detectOpenHandles

# Check jest.config.js is present
ls -la jest.config.js
```

---

## 🔍 Debugging Tips

### Enable Debug Logging

**Backend:**
```bash
# Set debug mode
DEBUG=* npm run dev

# Or in .env
DEBUG=express:*,prisma:*
```

**Frontend:**
```bash
# Enable Next.js debug logging
DEBUG=next:* npm run dev
```

### Chrome DevTools

1. Open DevTools (F12)
2. Go to Network tab to inspect API calls
3. Go to Console tab for JavaScript errors
4. Go to Application tab for localStorage/cookies
5. Go to Sources tab for debugging

### VS Code Debugging

**Backend Debug Configuration:**
```json
{
  "type": "node",
  "request": "launch",
  "name": "Launch Backend",
  "program": "${workspaceFolder}/backend/src/app.ts",
  "preLaunchTask": "tsc: build",
  "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"]
}
```

---

## 📞 Still Need Help?

### Resources
- 📖 [README.md](README.md) - Project overview
- 📚 [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) - Contributing guidelines

### Contact
- 💬 [GitHub Discussions](https://github.com/jathu3461-eng/Mukurtham_Matrimoney/discussions)
- 🐛 [GitHub Issues](https://github.com/jathu3461-eng/Mukurtham_Matrimoney/issues)
- 📧 support@mukurtham.com

---

*Last Updated: 2026-07-09*
