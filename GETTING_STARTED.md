# 🎯 GETTING STARTED - Mukurtham Matrimony

**5-minute quick start guide to launch the application locally**

---

## ✅ Prerequisites

- **Node.js 18+** - [Install](https://nodejs.org/)
- **Docker** - [Install](https://www.docker.com/)
- **Git** - [Install](https://git-scm.com/)
- **Code Editor** - VS Code recommended

---

## 🚀 Quick Start (5 Steps)

### Step 1: Clone Repository
```bash
git clone https://github.com/jathu3461-eng/Mukurtham_Matrimoney.git
cd "Mukurtham Matrimony"
```

### Step 2: Install Dependencies
```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### Step 3: Start Services
```bash
# Start Docker services (MySQL + Redis)
docker-compose -f infrastructure/docker-compose.yml up -d

# Wait 5 seconds for services to start
sleep 5
```

### Step 4: Setup Database
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
cd ..
```

### Step 5: Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

✅ **Done!** Open http://localhost:3000 in your browser

---

## 🎨 Frontend Architecture

```
frontend/
├── app/
│   ├── (public)/          # Public pages (landing, login, register)
│   ├── (dashboard)/       # Protected pages (profile, search, admin)
│   ├── layout.tsx         # Root layout wrapper
│   └── page.tsx           # Home page
├── components/
│   ├── shared/            # Reusable components (Button, Card, Input)
│   └── forms/             # Form components
├── lib/
│   └── api.ts             # API client utility
├── .env                   # Frontend configuration
└── package.json
```

### Key Frontend Routes
- `/` - Landing page
- `/register` - User registration
- `/login` - User login
- `/search` - Find matches
- `/profile` - My profile
- `/dashboard` - User dashboard

---

## 🔧 Backend Architecture

```
backend/
├── src/
│   ├── app.ts             # Express server setup
│   ├── config/            # Database & Redis config
│   ├── controllers/       # API request handlers
│   ├── routes/            # API route definitions
│   ├── middleware/        # Auth, validation, error handling
│   ├── utils/             # Helper functions (auth, email, etc)
│   └── tests/             # Test files
├── .env                   # Backend configuration
└── package.json
```

### Key API Routes
- `/api/v1/auth` - Authentication (register, login, refresh token)
- `/api/v1/profiles` - Profile management
- `/api/v1/search` - Profile search & AI matching
- `/api/v1/lists` - Interests & messaging
- `/api/v1/ai` - AI features (bio generation, photo verification)
- `/api/v1/payments` - Stripe payment integration
- `/api/v1/admin` - Admin panel endpoints

---

## 🗄️ Database Setup

**Schema Overview:**
```sql
-- Core Tables
users                    -- User accounts & authentication
profiles                 -- Matrimony profiles
photos                   -- Profile photos
interests                -- Match expressions
conversations            -- Message threads
messages                 -- Message content
memberships              -- Subscription plans
payments                 -- Payment transactions
```

**Reset Database (if needed):**
```bash
cd backend
npm run prisma:migrate -- reset
```

---

## 🌐 Key Features

### For Users
- ✅ Secure registration & login
- ✅ Create detailed matrimony profile
- ✅ AI-powered match recommendations
- ✅ Horoscope (Raasi/Nakshatram) compatibility
- ✅ Send/receive interests
- ✅ Secure messaging system
- ✅ Profile verification & moderation
- ✅ Premium membership plans

### For Admins
- ✅ Moderation dashboard
- ✅ Profile verification queue
- ✅ User management
- ✅ Analytics & reports
- ✅ Payment tracking
- ✅ Dispute resolution

---

## 📝 Environment Configuration

### Backend `.env` Variables
```bash
PORT=8000
NODE_ENV=development
DATABASE_URL="mysql://mukurtham_user:mukurtham_password@localhost:3306/mukurtham_matrimony"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
CLIENT_ORIGIN="http://localhost:3000"
```

### Frontend `.env` Variables
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🔍 Testing the Application

### Test User Registration
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test@123456",
    "phoneNumber": "+14165550123"
  }'
```

### Test API Health
```bash
curl http://localhost:8000/api/health
# Should return: {"status": "healthy", ...}
```

### Test Frontend Connection
```bash
# Open in browser
http://localhost:3000

# Should show landing page with:
# - Hero section
# - Features
# - Testimonials
# - Call-to-action buttons
```

---

## 🎮 Common Tasks

### Create a Test Profile
1. Go to http://localhost:3000/register
2. Register with test account
3. Go to http://localhost:3000/profile/create
4. Fill in profile details
5. Upload profile photo
6. Submit for moderation

### Search for Matches
1. Login to http://localhost:3000
2. Go to Search page
3. Set filters (age, location, religion, etc)
4. Browse profiles
5. Send interest

### Send Interest / Message
1. Find a profile
2. Click "Send Interest"
3. Once accepted, click "Chat"
4. Send secure messages

---

## 📊 Admin Dashboard

**Access Admin Features:**
```bash
# In database, manually set user role to admin
# Then navigate to:
http://localhost:3000/admin

# View moderation queue
# Approve/reject profiles
# View analytics
# Manage users
```

---

## 🚨 Common Issues & Solutions

### Can't connect to database?
```bash
# Check if Docker services are running
docker-compose -f infrastructure/docker-compose.yml ps

# If not, start them
docker-compose -f infrastructure/docker-compose.yml up -d
```

### Port already in use?
```bash
# Kill process using port 8000
lsof -i :8000 | grep LISTEN
kill -9 <PID>

# Or change port in backend/.env
PORT=8001
```

### Frontend can't reach backend?
```bash
# Verify in frontend/.env:
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Restart frontend
npm run dev
```

For more help, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Project overview & features |
| [API.md](API.md) | Complete API reference |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment guide |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributing guidelines |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues & solutions |

---

## 🔗 Useful Links

- 📖 [Project Repository](https://github.com/jathu3461-eng/Mukurtham_Matrimoney)
- 🐛 [Report Issues](https://github.com/jathu3461-eng/Mukurtham_Matrimoney/issues)
- 💬 [Discussions](https://github.com/jathu3461-eng/Mukurtham_Matrimoney/discussions)
- 📧 [Contact Us](mailto:dev@mukurtham.com)

---

## ✨ Next Steps

1. ✅ Get the app running locally
2. 📝 Create a test profile
3. 🔍 Test search & matching features
4. 💻 Explore the codebase
5. 🤝 Make your first contribution!

---

**Questions?** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or open a [GitHub Issue](https://github.com/jathu3461-eng/Mukurtham_Matrimoney/issues)

**Happy coding! 🎉**
