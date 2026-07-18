# 🇱🇰 Mukurtham Matrimony - Modern Matrimony Platform

**Professional Tamil Matrimony Platform connecting Sri Lankan Tamil & Tamil Diaspora communities globally**

---

## 📊 Quick Overview

- **Frontend**: Next.js 15 with React 19, TailwindCSS, Framer Motion
- **Backend**: Express.js (TypeScript), Prisma ORM
- **Database**: MySQL 8.0
- **Cache**: Redis 7.0
- **Architecture**: Microservices-ready, Docker-containerized
- **Scale**: Built for 10,000,000+ users with enterprise-grade security

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ & npm
- Docker & Docker Compose
- MySQL 8.0+ (or use Docker)
- Redis 7.0+ (or use Docker)

### Step 1: Clone & Install
```bash
# Clone the repository
git clone https://github.com/jathu3461-eng/Mukurtham_Matrimoney.git
cd "Mukurtham Matrimony"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Go back to root
cd ..
```

### Step 2: Start Docker Services
```bash
# Start MySQL and Redis using Docker Compose
docker-compose -f infrastructure/docker-compose.yml up -d

# Verify services are running
docker ps
# You should see: mukurtham-mysql and mukurtham-redis containers
```

### Step 3: Setup Database
```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed initial data (optional)
npm run prisma:seed

cd ..
```

### Step 4: Configure Environment
```bash
# Backend is already configured in backend/.env

# Verify frontend .env
cat frontend/.env
# Should have NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Step 5: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on: http://localhost:8000
# Health check: http://localhost:8000/api/health
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on: http://localhost:3000
```

✅ **Open browser**: http://localhost:3000

---

## 🏗️ Project Structure

```
├── backend/                    # Express API server
│   ├── src/
│   │   ├── app.ts             # Express app setup
│   │   ├── config/            # Database & Redis config
│   │   ├── controllers/       # API logic
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth, validation, errors
│   │   ├── utils/             # Helpers (auth, email, etc)
│   │   └── tests/             # Test setup
│   ├── .env                   # Configuration
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # Next.js application
│   ├── app/
│   │   ├── (public)/          # Public pages (landing, login, register)
│   │   ├── (dashboard)/       # Protected pages (profile, search, admin)
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Root redirect
│   ├── components/            # Reusable UI components
│   ├── .env                   # Frontend configuration
│   ├── package.json
│   └── tsconfig.json
│
├── database/                   # Prisma schema & migrations
│   └── prisma/
│       ├── schema.prisma      # Database schema (10M+ user scale)
│       ├── seed.ts            # Sample data
│       └── migrations/        # Database versions
│
└── infrastructure/             # Docker setup
    └── docker-compose.yml     # MySQL + Redis services
```

---

## 📡 API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Create new account
- `POST /login` - User login with JWT
- `POST /refresh-token` - Refresh access token
- `POST /logout` - Logout user

### Profiles (`/api/v1/profiles`)
- `POST /` - Create profile
- `GET /:id` - Get profile details
- `PUT /:id` - Update profile
- `DELETE /:id` - Deactivate profile
- `GET /:id/photos` - Get profile photos

### Search (`/api/v1/search`)
- `GET /` - Search profiles with filters
- `POST /ai-match` - Get AI-powered matches
- `GET /recommendations` - Personalized recommendations

### Interests & Messages (`/api/v1/lists`)
- `POST /interests` - Send interest
- `PUT /interests/:id` - Accept/reject interest
- `GET /conversations` - Get message conversations

### AI Features (`/api/v1/ai`)
- `POST /generate-bio` - AI bio generation
- `POST /match-score` - AI compatibility scoring
- `POST /verify-photo` - AI photo verification

### Payments (`/api/v1/payments`)
- `POST /create-checkout` - Stripe checkout session
- `POST /webhook` - Stripe webhook handler
- `GET /plans` - Get membership plans

### Admin (`/api/v1/admin`)
- `GET /dashboard` - Analytics dashboard
- `GET /profiles/pending` - Moderation queue
- `PUT /profiles/:id/verify` - Approve profile
- `PUT /profiles/:id/suspend` - Suspend account

---

## 🔐 Security Features

✅ **JWT Authentication** - Secure token-based auth
✅ **CORS Protection** - Origin validation  
✅ **Helmet.js** - HTTP security headers
✅ **Rate Limiting** - Brute-force protection
✅ **Password Hashing** - bcryptjs encryption
✅ **SQL Injection Prevention** - Prisma parameterized queries
✅ **XSS Protection** - Content Security Policy
✅ **Email Verification** - OTP validation
✅ **Phone Verification** - Twilio SMS OTP
✅ **Two-Factor Authentication** - Optional 2FA

---

## 🗄️ Database Schema Highlights

### Core Tables
- **users** - Authentication & profiles
- **profiles** - Matrimony profile details
- **photos** - Profile images with verification
- **interests** - Match expressions
- **conversations & messages** - Encrypted messaging
- **memberships & payments** - Subscription management
- **horoscope_data** - Raasi/Nakshatram information

### Search Indices
- Full-text search on names, bios
- Location-based search (geo-indexing ready)
- Interest & match preference indexing

---

## 🎨 Frontend Features

### Modern UI/UX
- **Hero Landing Page** - Eye-catching design with parallax
- **Dark Mode Support** - Complete theme switching
- **Responsive Design** - Mobile-first approach (works on all devices)
- **Smooth Animations** - Framer Motion transitions
- **Accessibility** - WCAG 2.1 AA compliant

### Pages
- **Public**: Landing, Login, Register, Search, Pricing
- **User Dashboard**: Profile, Matches, Interests, Messages
- **Broker Portal**: Analytics, Leads, Commission Tracking
- **Admin Panel**: Moderation, Analytics, User Management

---

## 🛠️ Configuration Guide

### Backend Environment Variables

```bash
# Server
PORT=8000
NODE_ENV=development

# Database
DATABASE_URL="mysql://user:password@localhost:3306/mukurtham_matrimony"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets (change in production!)
JWT_SECRET="your_secret_key_here"
JWT_REFRESH_SECRET="your_refresh_secret_here"

# Email (Gmail SMTP)
NODEMAILER_USER="your-email@gmail.com"
NODEMAILER_PASS="your-app-password"

# Image Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"

# Payment (Stripe)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLIC_KEY="pk_test_..."
```

### Frontend Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📦 Docker Deployment

### Run Everything in Docker
```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down
```

### Production Deployment
See `infrastructure/docker-compose.prod.yml` for production configuration.

---

## ✅ Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### API Health Check
```bash
# Should return service status
curl http://localhost:8000/api/health
```

---

## 🚨 Troubleshooting

### "Connection refused" on port 3306
```bash
# Ensure Docker containers are running
docker-compose -f infrastructure/docker-compose.yml ps

# If not running, start them
docker-compose -f infrastructure/docker-compose.yml up -d
```

### "Cannot find module '@prisma/client'"
```bash
cd backend
npm run prisma:generate
```

### Frontend not connecting to backend
```bash
# Check frontend/.env
# Ensure NEXT_PUBLIC_API_URL points to backend URL
# Default: http://localhost:8000/api/v1
```

### Port already in use
```bash
# Backend (port 8000)
lsof -i :8000
kill -9 <PID>

# Frontend (port 3000)
lsof -i :3000
kill -9 <PID>
```

---

## 📚 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TailwindCSS 4, Framer Motion |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | MySQL 8.0, Prisma ORM |
| **Caching** | Redis 7.0 |
| **Authentication** | JWT, bcryptjs |
| **APIs** | Cloudinary, Stripe, Twilio, Nodemailer |
| **Containerization** | Docker, Docker Compose |
| **DevTools** | ts-node-dev, Jest, ESLint, Prettier |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Support

For issues, questions, or suggestions:
- GitHub Issues: [Report a bug](https://github.com/jathu3461-eng/Mukurtham_Matrimoney/issues)
- Email: support@mukurtham.com

---

## 🙏 Acknowledgments

Built with ❤️ for the Sri Lankan Tamil & Global Tamil Diaspora communities.

**Connecting families, building futures!**

---

*Last Updated: 2026-07-09*
*Version: 1.0.0*
