# 📡 API DOCUMENTATION - Mukurtham Matrimony

Complete API reference for the Mukurtham Matrimony platform.

**Base URL:** `http://localhost:8000/api/v1`

---

## 🔑 Authentication

All protected endpoints require a Bearer token in the Authorization header.

```bash
Authorization: Bearer <access_token>
```

---

## 👤 Authentication Endpoints

### Register User
```
POST /auth/register
```

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "phoneNumber": "+14165550123",
  "uiLanguage": "en"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Please log in.",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "uiLanguage": "en",
      "roles": ["user"]
    }
  }
}
```

**Errors:**
- `409` - Conflict (Email/username already exists)
- `400` - Validation error

---

### Login User
```
POST /auth/login
```

**Request Body:**
```json
{
  "usernameOrEmail": "john_doe or john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "roles": ["user"]
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### Refresh Token
```
POST /auth/refresh-token
Authorization: Bearer <refresh_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### Logout
```
POST /auth/logout
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 👨‍💼 Profile Endpoints

### Create Profile
```
POST /profiles
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15",
  "gender": "M",
  "religion": "Hindu",
  "caste": "Vellalar",
  "raasi": "Libra",
  "star": "Swati",
  "maritalStatus": "never_married",
  "height": 180,
  "motherTongue": "Tamil",
  "education": "Bachelor's Degree",
  "occupation": "Software Engineer",
  "annualIncome": "80000",
  "country": "Canada",
  "state": "Ontario",
  "city": "Toronto",
  "aboutMe": "Passionate software engineer looking for a like-minded partner",
  "familyValues": "Joint",
  "registeredFor": "self"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Profile created successfully",
  "data": {
    "id": 42,
    "userId": 1,
    "firstName": "John",
    "lastName": "Doe",
    "status": "pending_moderation"
  }
}
```

---

### Get Profile
```
GET /profiles/:profileId
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15",
    "photos": [
      {
        "id": 101,
        "url": "https://res.cloudinary.com/...",
        "status": "approved",
        "isPrimary": true
      }
    ]
  }
}
```

---

### Update Profile
```
PUT /profiles/:profileId
Authorization: Bearer <access_token>
```

**Request Body:** (Same as create, but partial fields allowed)
```json
{
  "aboutMe": "Updated bio",
  "occupation": "Senior Engineer"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated profile */ }
}
```

---

### Delete Profile (Deactivate)
```
DELETE /profiles/:profileId
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile deactivated successfully"
}
```

---

## 🔍 Search Endpoints

### Search Profiles
```
POST /search
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "gender": "F",
  "ageMin": 22,
  "ageMax": 32,
  "country": "Canada",
  "religion": "Hindu",
  "maritalStatus": "never_married",
  "page": 1,
  "limit": 20
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "profiles": [
      {
        "id": 50,
        "firstName": "Priya",
        "age": 28,
        "city": "Vancouver",
        "religion": "Hindu",
        "compatibilityScore": 85
      }
    ],
    "total": 245,
    "page": 1,
    "limit": 20
  }
}
```

---

### Get AI Matches
```
GET /search/ai-match?limit=10
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": 50,
        "firstName": "Priya",
        "compatibilityScore": 92,
        "matchReason": "Similar interests in travel and philosophy"
      }
    ]
  }
}
```

---

### Get Recommendations
```
GET /search/recommendations
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": 55,
        "firstName": "Anjali",
        "reason": "Based on your preferences"
      }
    ]
  }
}
```

---

## ❤️ Interest Endpoints

### Send Interest
```
POST /lists/interests
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "recipientId": 50,
  "message": "I'm interested in getting to know you better"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Interest sent successfully",
  "data": {
    "id": 100,
    "recipientId": 50,
    "status": "pending"
  }
}
```

---

### Get Interests Received
```
GET /lists/interests/received?status=pending
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "interests": [
      {
        "id": 100,
        "senderId": 45,
        "senderName": "Amit",
        "status": "pending",
        "createdAt": "2026-07-09T10:30:00Z"
      }
    ],
    "total": 5
  }
}
```

---

### Accept/Reject Interest
```
PUT /lists/interests/:interestId
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "action": "accept" // or "reject"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Interest accepted",
  "data": {
    "id": 100,
    "status": "accepted"
  }
}
```

---

## 💬 Messaging Endpoints

### Get Conversations
```
GET /lists/conversations
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": 1,
        "participantId": 50,
        "participantName": "Priya",
        "lastMessage": "Looking forward to meeting you!",
        "lastMessageTime": "2026-07-09T14:22:00Z",
        "unreadCount": 2
      }
    ]
  }
}
```

---

### Get Messages
```
GET /lists/conversations/:conversationId/messages?limit=20
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 500,
        "senderId": 45,
        "content": "Hi there!",
        "createdAt": "2026-07-09T10:00:00Z",
        "isRead": true
      }
    ]
  }
}
```

---

### Send Message
```
POST /lists/conversations/:conversationId/messages
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "content": "Hey! How are you doing?"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 501,
    "content": "Hey! How are you doing?",
    "createdAt": "2026-07-09T15:30:00Z"
  }
}
```

---

## 🤖 AI Endpoints

### Generate Bio
```
POST /ai/generate-bio
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "profession": "Software Engineer",
  "hobbies": ["Reading", "Traveling", "Cooking"],
  "personality": "Outgoing",
  "language": "en"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bio": "I'm a passionate software engineer who loves exploring new cultures through travel. When I'm not coding, you'll find me in the kitchen experimenting with new recipes or lost in a good book. Looking for someone who appreciates adventure and good conversations!"
  }
}
```

---

### Calculate Match Score
```
POST /ai/match-score
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "profileId1": 42,
  "profileId2": 50
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "compatibility": 87,
    "factors": {
      "valueAlignment": 90,
      "lifestyleCompatibility": 85,
      "horoscopeMatch": 82,
      "interestOverlap": 87
    }
  }
}
```

---

### Verify Photo
```
POST /ai/verify-photo
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request (multipart):**
```
file: <image_file>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "confidence": 0.95,
    "issues": []
  }
}
```

---

## 💳 Payment Endpoints

### Get Membership Plans
```
GET /payments/plans
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "premium_monthly",
        "name": "Premium",
        "price": 49.99,
        "currency": "CAD",
        "duration": "1 month",
        "features": [
          "Unlimited search",
          "Direct messaging",
          "AI matches",
          "Priority placement"
        ]
      }
    ]
  }
}
```

---

### Create Checkout Session
```
POST /payments/create-checkout
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "planId": "premium_monthly"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_..."
  }
}
```

---

### Payment Webhook
```
POST /payments/webhook
```

**Stripe sends this automatically**

---

## 👨‍💼 Admin Endpoints

### Get Dashboard Analytics
```
GET /admin/dashboard
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 50000,
    "totalProfiles": 45000,
    "pendingModeration": 234,
    "activeMembers": 28000,
    "successfulMatches": 8500,
    "revenue": {
      "daily": 5000,
      "monthly": 150000,
      "annual": 1800000
    }
  }
}
```

---

### Get Pending Profiles
```
GET /admin/profiles/pending?page=1&limit=20
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "profiles": [
      {
        "id": 42,
        "userName": "john_doe",
        "submittedAt": "2026-07-08T10:00:00Z",
        "issues": ["Photo verification failed"]
      }
    ],
    "total": 234
  }
}
```

---

### Verify Profile
```
PUT /admin/profiles/:profileId/verify
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "approved": true,
  "notes": "All documents verified"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile approved",
  "data": { /* updated profile */ }
}
```

---

### Suspend Account
```
PUT /admin/profiles/:profileId/suspend
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "reason": "Suspicious activity",
  "durationDays": 30
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Account suspended for 30 days"
}
```

---

## 🏥 Health Check

### API Health Status
```
GET /health
```

**Response (200):**
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "redis": "connected"
  },
  "version": "1.0.0",
  "timestamp": "2026-07-09T15:30:00Z"
}
```

---

## ⚠️ Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "message": "Descriptive error message",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `CONFLICT` | 409 | Resource already exists |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily down |

---

## 🔐 Rate Limiting

API endpoints have rate limits to prevent abuse:

- **General endpoints:** 100 requests/minute
- **Auth endpoints:** 5 requests/minute
- **Search endpoints:** 30 requests/minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1657380600
```

---

## 📝 Example: Complete Registration Flow

```bash
# 1. Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePassword123!",
    "phoneNumber": "+14165550123"
  }'

# 2. Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "john_doe",
    "password": "SecurePassword123!"
  }'

# 3. Create Profile (use accessToken from login response)
curl -X POST http://localhost:8000/api/v1/profiles \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15",
    "gender": "M",
    "religion": "Hindu",
    "caste": "Vellalar"
  }'

# 4. Search Profiles
curl -X POST http://localhost:8000/api/v1/search \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "gender": "F",
    "ageMin": 22,
    "ageMax": 32,
    "country": "Canada"
  }'

# 5. Send Interest
curl -X POST http://localhost:8000/api/v1/lists/interests \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": 50
  }'
```

---

## 📚 Additional Resources

- [README.md](README.md) - Project overview
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contributing guidelines
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Troubleshooting guide

---

*Last Updated: 2026-07-09*
*API Version: 1.0.0*
