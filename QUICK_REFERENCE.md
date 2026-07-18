# 🎯 QUICK REFERENCE - API & ADMIN SETUP

## 🚀 Quick Start (5 minutes)

### 1. Start Database
```bash
# Docker (recommended)
docker-compose -f infrastructure/docker-compose.yml up -d

# OR local MySQL - Ensure running on localhost:3306
```

### 2. Apply Migrations
```bash
cd backend
npm run prisma:migrate
```

### 3. Verify Health
```bash
curl http://localhost:8000/api/health

# ✅ Should show:
# {
#   "status": "healthy",
#   "services": {"database": "connected", "redis": "connected"}
# }
```

### 4. Test Admin
- Go to: http://localhost:3000/admin/dashboard
- Register as admin (accountType: "admin")
- Login and view dashboard

---

## 👤 User Account Types

| Type | Can Do |
|------|--------|
| `individual` | Create 1 profile, search, send interests |
| `broker` | Create agency, manage multiple profiles |
| `admin` | View all data, moderate, manage users |
| `moderator` | View profiles, approve photos, manage reports |

---

## 📍 Admin API Endpoints

### Get Admin Stats
```bash
curl -X GET http://localhost:8000/api/v1/admin/dashboard/stats \
  -H "Authorization: Bearer {JWT_TOKEN}"

# Returns: totalUsers, totalProfiles, activeMembers, totalRevenue, etc.
```

### Get All Users
```bash
curl -X GET http://localhost:8000/api/v1/admin/users \
  -H "Authorization: Bearer {JWT_TOKEN}"

# Optional filters:
# ?role=user (or broker/admin)
```

### Get Brokers (NEW)
```bash
curl -X GET http://localhost:8000/api/v1/admin/brokers \
  -H "Authorization: Bearer {JWT_TOKEN}"

# Optional filters:
# ?verified=true (or false)

# Returns:
# - Agency name & license
# - Verification status
# - User contact info
# - Profile quota
```

### Get Payments
```bash
curl -X GET http://localhost:8000/api/v1/admin/payments \
  -H "Authorization: Bearer {JWT_TOKEN}"

# Optional filters:
# ?status=succeeded (or pending/failed)
```

### Get Photo Moderation Queue
```bash
curl -X GET http://localhost:8000/api/v1/admin/moderation/queue \
  -H "Authorization: Bearer {JWT_TOKEN}"

# Shows pending photos waiting for approval
```

### Approve Photo
```bash
curl -X POST http://localhost:8000/api/v1/admin/moderation/approve/1 \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

### Toggle User Status
```bash
curl -X PUT http://localhost:8000/api/v1/admin/users/1/status \
  -H "Authorization: Bearer {JWT_TOKEN}"

# Suspends/activates user account
```

---

## 👤 User Registration & Profile Flow

### 1. Register User
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "username",
    "password": "Password123!",
    "phoneNumber": "+1234567890",
    "accountType": "individual"
  }'

# Response: {accessToken, refreshToken}
```

### 2. Create Profile
```bash
curl -X POST http://localhost:8000/api/v1/profiles \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "gender": "M",
    "dateOfBirth": "1995-05-15",
    "maritalStatus": "never_married",
    "religionId": 1,
    "casteId": 1,
    "currentCountryId": 232
  }'

# Profile stored with status: "pending_moderation"
```

### 3. Upload Photo
```bash
curl -X POST http://localhost:8000/api/v1/profiles/1/photos \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -F "photo=@photo.jpg"

# Photo stored with status: "pending"
# Photo appears in admin moderation queue
```

### 4. Admin Approves Photo
```bash
# Admin views: GET /api/v1/admin/moderation/queue
# Admin approves: POST /api/v1/admin/moderation/approve/1
# Photo status changes to: "approved"
# Profile becomes visible in search
```

---

## 🏢 Broker Registration Flow

### 1. Register Broker Account
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "broker@agency.com",
    "username": "brokeragency",
    "password": "Password123!",
    "phoneNumber": "+1234567890",
    "accountType": "broker"
  }'
```

### 2. Broker Creates Agency Profile
```bash
curl -X POST http://localhost:8000/api/v1/brokers/profile \
  -H "Authorization: Bearer {BROKER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "agencyName": "Tamil Matrimony Brokers",
    "licenseNumber": "TN-2026-0001"
  }'

# Stored in database.broker_profiles
```

### 3. Admin Views Brokers
```bash
curl -X GET http://localhost:8000/api/v1/admin/brokers \
  -H "Authorization: Bearer {ADMIN_TOKEN}"

# Shows:
# - Agency name: "Tamil Matrimony Brokers"
# - License: "TN-2026-0001"
# - Verification: false (pending)
# - Contact: broker@agency.com
# - Status: active
```

### 4. Admin Verifies Broker
```bash
# Admin marks isVerified = true
# Broker can now manage client profiles
# Can manage up to maxProfileQuota profiles
```

---

## 📊 Database Tables (When MySQL Running)

| Table | Stores | Key Fields |
|-------|--------|-----------|
| `users` | User accounts | email, username, accountType |
| `profiles` | Matrimony profiles | name, gender, religion, status |
| `photos` | Profile photos | profileId, status, url |
| `broker_profiles` | Broker agencies | agencyName, license, verified |
| `payments` | Transactions | userId, amount, status |
| `user_memberships` | Premium subscriptions | userId, type, status |
| `favorites` | Liked profiles | userId, favoriteProfileId |
| `interests` | Interest exchanges | senderId, recipientId, status |

---

## 🔐 Authentication

### Get JWT Token (Login)
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'

# Response:
# {
#   "accessToken": "eyJhbGc...",
#   "refreshToken": "eyJhbGc..."
# }
```

### Use Token in Requests
```bash
curl -X GET http://localhost:8000/api/v1/profiles/me \
  -H "Authorization: Bearer eyJhbGc..."
```

### Refresh Token
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh-token \
  -H "Authorization: Bearer {REFRESH_TOKEN}"

# Returns new accessToken
```

---

## 🎨 Admin Dashboard Routes

| Route | Purpose |
|-------|---------|
| `/admin/dashboard` | Main dashboard with stats |
| `/admin/dashboard?tab=overview` | Statistics overview |
| `/admin/dashboard?tab=users` | User management |
| `/admin/dashboard?tab=brokers` | Broker management (NEW) |
| `/admin/dashboard?tab=payments` | Payment tracking |

---

## 📱 Frontend API Client

### Use API in React Components
```typescript
import { apiClient } from '@/lib/api';

// Get admin stats
const stats = await apiClient.getAdminStats(token);

// Get all brokers
const brokers = await apiClient.getAdminBrokers(token);

// Get verified brokers only
const verified = await apiClient.getAdminBrokers(token, true);

// Get payments
const payments = await apiClient.getAdminPayments(token, 'succeeded');
```

---

## 🐛 Troubleshooting

### Database Not Connecting
```
Error: Can't reach database server at localhost:3306
Solution:
1. Ensure MySQL is running
2. Check credentials in backend/.env
3. Verify port 3306 is open
```

### Admin Endpoints Return 401
```
Error: Unauthorized
Solution:
1. Ensure you have valid JWT token
2. Token must be from admin/moderator account
3. Include: Authorization: Bearer {TOKEN}
```

### Photos Not Uploading
```
Error: Upload failed
Solution:
1. Ensure Cloudinary credentials in backend/.env
2. Check file size (max 10MB)
3. Check file format (jpg, png, etc.)
```

---

## ✅ Verification Checklist

- [ ] MySQL running on localhost:3306
- [ ] Migrations applied (`npm run prisma:migrate`)
- [ ] Backend health check shows healthy
- [ ] Frontend loads on http://localhost:3000
- [ ] Can register new user
- [ ] Can create profile
- [ ] Can login to admin dashboard
- [ ] Can see users in admin panel
- [ ] Can see brokers in admin panel
- [ ] Can see stats in dashboard

---

## 🎯 Next Steps After Setup

1. **Create Admin Account**: Register with accountType: "admin"
2. **Create Test User**: Register regular user and create profile
3. **Upload Photo**: Add photo to profile
4. **Admin Approval**: Approve photo from moderation queue
5. **Verify Data**: Check that user appears in admin users table
6. **Test Broker**: Register broker and create agency
7. **View Broker**: Check broker appears in /admin/brokers

---

## 📚 Full Documentation

- `DATABASE_SETUP.md` - Database configuration
- `SYSTEM_VERIFICATION_REPORT.md` - Complete system overview
- `API.md` - Full API documentation
- `COMPLETE_SYSTEM_STATUS.md` - Current status report
- `DEPLOYMENT.md` - Production deployment guide

---

**Everything is ready! Just initialize the database and start using the system.** 🚀
