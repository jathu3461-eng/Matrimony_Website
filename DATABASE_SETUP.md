# Mukurtham Matrimony - Complete System Setup & Verification Guide

## 🚀 Current System Status

### ✅ What's Working:
- **Frontend**: Next.js 15.5.20 running on http://localhost:3000
- **Backend API**: Express.js running on http://localhost:8000 (with Mock Redis)
- **UI Components**: All modern components created and functional
- **API Endpoints**: All routes defined and ready

### ⚠️ Database Configuration Status:
- **MySQL**: Not running on localhost:3306 (Docker required for local setup)
- **Redis**: Using Mock In-Memory fallback for development
- **Database**: Prisma configured but needs MySQL running

---

## 📋 System Setup Prerequisites

### Option 1: Using Docker (Recommended)
```bash
# On Windows, ensure Docker Desktop is installed and running
# Then start the services:
docker-compose -f infrastructure/docker-compose.yml up -d

# Verify services are running:
docker ps
# Should show mukurtham-mysql and mukurtham-redis containers
```

### Option 2: Local MySQL Installation
If Docker is not available, install MySQL 8.0 locally:

1. **Windows**: 
   - Download MySQL Community Server from https://dev.mysql.com/downloads/
   - Run installer with these credentials:
     - Root Password: `root_password`
     - Username: `mukurtham_user`
     - Password: `mukurtham_password`
     - Port: `3306`

2. **Create Database**:
   ```sql
   CREATE DATABASE mukurtham_matrimony;
   ```

3. **Apply Migrations**:
   ```bash
   cd backend
   npm run prisma:migrate
   ```

---

## 🗄️ Database Configuration Verification

### 1. Check Database Connection (.env file)
```bash
cat backend/.env | grep DATABASE_URL
# Expected output:
# DATABASE_URL="mysql://mukurtham_user:mukurtham_password@localhost:3306/mukurtham_matrimony"
```

### 2. Verify Environment Variables
```bash
# Backend environment (backend/.env)
PORT=8000
DATABASE_URL="mysql://mukurtham_user:mukurtham_password@localhost:3306/mukurtham_matrimony"
REDIS_URL="redis://localhost:6379"
CLIENT_ORIGIN="http://localhost:3000"
JWT_SECRET="super_secret_jwt_sign_key_9876543210!"

# Frontend environment (frontend/.env)
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
```

### 3. Run Database Tests
```bash
# From backend directory:
npm run prisma:studio  # Opens Prisma Studio to view/edit data

# Or test connection:
cd backend
npx prisma db execute --stdin < test-migration.sql
```

---

## 📊 Admin Panel API Endpoints

### Dashboard Stats
```bash
# Get admin dashboard statistics
curl -X GET http://localhost:8000/api/v1/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

Response:
{
  "success": true,
  "data": {
    "totalUsers": 0,
    "totalProfiles": 0,
    "totalFavorites": 0,
    "totalPayments": 0,
    "activeMembers": 0,
    "pendingPhotos": 0,
    "openReports": 0,
    "totalRevenue": 0
  }
}
```

### User Management
```bash
# Get all users
curl -X GET http://localhost:8000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get users by role (user, broker, admin)
curl -X GET http://localhost:8000/api/v1/admin/users?role=broker \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Toggle user status
curl -X PUT http://localhost:8000/api/v1/admin/users/1/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Broker Management ✨ NEW
```bash
# Get all brokers with detailed information
curl -X GET http://localhost:8000/api/v1/admin/brokers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get verified brokers only
curl -X GET http://localhost:8000/api/v1/admin/brokers?verified=true \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

Response shows:
- Agency name
- License number
- Verification status
- User email and name
- Account join date
```

### Profile & Photo Moderation
```bash
# Get moderation queue (pending photos)
curl -X GET http://localhost:8000/api/v1/admin/moderation/queue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Approve a photo
curl -X POST http://localhost:8000/api/v1/admin/moderation/approve/:photoId \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Reject a photo
curl -X POST http://localhost:8000/api/v1/admin/moderation/reject/:photoId \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Payment Tracking
```bash
# Get all payments
curl -X GET http://localhost:8000/api/v1/admin/payments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get succeeded payments only
curl -X GET http://localhost:8000/api/v1/admin/payments?status=succeeded \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔐 Authentication Flow for Admin

1. **Register Admin Account**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@matrimony.com",
    "username": "adminuser",
    "password": "SecurePassword123!",
    "phoneNumber": "+1234567890",
    "accountType": "admin"
  }'
```

2. **Login to Get JWT Token**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@matrimony.com",
    "password": "SecurePassword123!"
  }'

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

3. **Use Token in Admin Requests**:
Replace `YOUR_JWT_TOKEN` with the `accessToken` from login response

---

## 📱 User Profile Creation Flow

### Step 1: User Registration
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johnsmith",
    "password": "Password123!",
    "phoneNumber": "+16175551234",
    "accountType": "individual"
  }'
```

### Step 2: Create User Profile
```bash
curl -X POST http://localhost:8000/api/v1/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -d '{
    "name": "John Smith",
    "gender": "M",
    "dateOfBirth": "1990-01-15",
    "maritalStatus": "never_married",
    "religionId": 1,
    "casteId": 1,
    "currentCountryId": 1,
    "height": "5.10",
    "dietType": "non_vegetarian",
    "drinkingHabit": "occasionally"
  }'
```

### Step 3: Upload Profile Photos
```bash
# Upload photo (multipart form-data)
curl -X POST http://localhost:8000/api/v1/profiles/:profileId/photos \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -F "photo=@photo.jpg"

# Photos go into moderation queue for admin approval
```

### Step 4: View Profile in Admin
```bash
# Admin can see this profile in moderation queue
curl -X GET http://localhost:8000/api/v1/admin/moderation/queue \
  -H "Authorization: Bearer {ADMIN_JWT_TOKEN}"

# Response includes:
# - User details (email, username)
# - Profile information (name, gender, age, religion)
# - Photos pending approval
# - Status: pending/approved/rejected
```

---

## 🧪 Complete Data Flow Testing

### 1. Create Test User
```bash
# Step 1: Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "username": "testuser",
    "password": "TestPass123!",
    "phoneNumber": "+14155552671",
    "accountType": "individual"
  }'
```

### 2. Create Test Profile
Use the JWT token from registration to create a profile

### 3. Upload Test Photo
Upload a photo that will appear in admin moderation queue

### 4. Admin Approval
Admin can approve/reject the photo from `/api/v1/admin/moderation/queue`

### 5. Verify Data Storage
Check that data persists in database using Prisma Studio

---

## 🏗️ Broker Management Flow

### Admin Creates/Views Brokers

1. **View All Brokers**:
```bash
curl -X GET http://localhost:8000/api/v1/admin/brokers \
  -H "Authorization: Bearer {ADMIN_JWT_TOKEN}"
```

2. **Verify/Manage Brokers**:
```bash
# Admin can see:
# - Agency name
# - License number
# - Verification status
# - Total profiles they manage
# - Contact information
# - Account status (active/suspended)
```

3. **Broker Profile Data Stored**:
```
✅ Agency name
✅ License number  
✅ Verification status
✅ Max profile quota
✅ Associated user account
✅ Creation/update timestamps
```

---

## 🔧 Troubleshooting

### MySQL Connection Error
**Error**: "Can't reach database server at `localhost:3306`"

**Solution**:
1. Ensure Docker is running (if using Docker):
   ```bash
   docker ps
   ```
2. Or ensure MySQL is installed locally and running:
   ```bash
   # Windows
   mysql -u root -p
   
   # Verify connection parameters
   cat backend/.env | grep DATABASE_URL
   ```

### Backend Health Check
```bash
curl http://localhost:8000/api/health

# Should return:
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### Admin Endpoints Returning 401 Unauthorized
Make sure:
1. You're using a valid JWT token from login
2. Token is included in `Authorization: Bearer {TOKEN}` header
3. User account has admin or moderator role

---

## 📦 Database Schema Overview

### Key Tables

#### Users Table
- id, email, username, password
- phoneNumber, accountType (individual/broker/admin)
- isSuspended, deletedAt
- createdAt, updatedAt

#### Profiles Table  
- id, userId (links to Users)
- name, gender, dateOfBirth, maritalStatus
- religionId, casteId (links to reference tables)
- currentCountryId
- profileStatus (draft/pending_moderation/active/suspended)
- photos array, documents array

#### BrokerProfiles Table (NEW)
- id, userId (unique relation to Users)
- agencyName, licenseNumber
- isVerified (boolean)
- maxProfileQuota (number of profiles they can manage)
- createdAt, updatedAt

#### Photos Table
- id, profileId (links to Profiles)
- publicId (Cloudinary), url
- status (pending/approved/rejected)
- uploadedAt

#### Payments Table
- id, userId, membershipId
- amount, currency
- status (pending/succeeded/failed/refunded)
- transactionId (from Stripe)
- createdAt

---

## ✅ Verification Checklist

- [ ] MySQL database running on localhost:3306
- [ ] Database `mukurtham_matrimony` created
- [ ] Prisma migrations applied
- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:3000
- [ ] Health endpoint returns healthy status
- [ ] Admin login works
- [ ] User profile creation works
- [ ] Photos upload to moderation queue
- [ ] Admin can view and approve photos
- [ ] Broker management endpoints functional
- [ ] Payment endpoints accessible

---

## 🚀 Next Steps

1. **Set up MySQL database** (Docker or local installation)
2. **Apply database migrations**: `npm run prisma:migrate`
3. **Create test admin user**
4. **Test complete user flow**: Register → Create Profile → Upload Photo → Admin Approve
5. **Verify broker management**: View brokers, verify licenses, manage quotas
6. **Test payment flow** (with Stripe test keys)
7. **Deploy to production** (see DEPLOYMENT.md)

---

**Last Updated**: 2026-07-09
**System Version**: 1.0.0
**Database Schema**: v2.0.0
