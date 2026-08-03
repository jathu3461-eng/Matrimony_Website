# 🚀 DEPLOYMENT GUIDE - Mukurtham Matrimony

This guide covers deploying the Mukurtham Matrimony platform to production environments.

---

## 📋 Pre-Deployment Checklist

- [ ] Database backups configured
- [ ] Environment variables secured (no secrets in code)
- [ ] SSL/TLS certificates ready
- [ ] Domain names configured
- [ ] CDN setup for static assets
- [ ] Email service configured (production SMTP)
- [ ] Payment gateway (Stripe) live keys
- [ ] Monitoring & logging setup (Sentry, New Relic)
- [ ] Backup strategy documented
- [ ] Rollback plan documented

---

## 🐳 Docker Deployment

### 1. Build Production Images

```bash
# Build backend
docker build -t mukurtham-backend:1.0.0 ./backend

# Build frontend
docker build -t mukurtham-frontend:1.0.0 ./frontend
```

### 2. Push to Registry (AWS ECR, Docker Hub, etc.)

```bash
# Example with Docker Hub
docker tag mukurtham-backend:1.0.0 yourusername/mukurtham-backend:1.0.0
docker push yourusername/mukurtham-backend:1.0.0

docker tag mukurtham-frontend:1.0.0 yourusername/mukurtham-frontend:1.0.0
docker push yourusername/mukurtham-frontend:1.0.0
```

### 3. Deploy with Docker Compose

```bash
# Use production compose file
docker-compose -f infrastructure/docker-compose.prod.yml up -d

# View logs
docker-compose logs -f
```

---

## ☁️ Cloud Deployment Options

### AWS Deployment (ECS/Fargate)

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name mukurtham-prod

# Push to ECR
aws ecr create-repository --repository-name mukurtham-backend
docker push <aws_account>.dkr.ecr.us-east-1.amazonaws.com/mukurtham-backend:1.0.0

# Deploy task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json
aws ecs create-service --cluster mukurtham-prod --service-name api --task-definition mukurtham-backend --desired-count 2
```

### Heroku Deployment

```bash
# Login to Heroku
heroku login

# Create app
heroku create mukurtham-matrimony

# Set environment variables
heroku config:set DATABASE_URL="mysql://..." JWT_SECRET="..." --app mukurtham-matrimony

# Deploy
git push heroku main

# View logs
heroku logs --tail --app mukurtham-matrimony
```

### DigitalOcean App Platform

```bash
# Create app.yaml
cat > app.yaml << 'EOF'
name: mukurtham-matrimony
services:
- name: backend
  github:
    repo: your-username/mukurtham_matrimony
    branch: main
  build_command: npm install && npm run build
  run_command: npm start
  
- name: frontend
  github:
    repo: your-username/mukurtham_matrimony
    branch: main
  build_command: npm install && npm run build
  run_command: npm start
EOF

# Deploy
doctl apps create --spec app.yaml
```

---

## 🔒 Security Hardening

### 1. Environment Variables
```bash
# Never commit secrets! Use secure secret management
# Options:
# - AWS Secrets Manager
# - GitHub Secrets
# - HashiCorp Vault
# - DigitalOcean App Platform Secrets

# Example with AWS
aws secretsmanager create-secret --name mukurtham/prod/env --secret-string file://prod.env
```

### 2. Database Security
```sql
-- Create read-only user for API
CREATE USER 'api_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON mukurtham_matrimony.* TO 'api_user'@'localhost';

-- Create backup user
CREATE USER 'backup_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT ON mukurtham_matrimony.* TO 'backup_user'@'localhost';
```

### 3. Nginx Reverse Proxy
```nginx
# /etc/nginx/sites-available/mukurtham
upstream backend {
  server 127.0.0.1:8000 max_fails=3 fail_timeout=30s;
  server 127.0.0.1:8001 max_fails=3 fail_timeout=30s;
}

server {
  listen 80;
  server_name mukurtham.com;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name mukurtham.com;

  # SSL Certificates
  ssl_certificate /etc/letsencrypt/live/mukurtham.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/mukurtham.com/privkey.pem;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;

  # API proxy
  location /api/ {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
  }

  # Frontend
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

---

## 📊 Monitoring & Logging

### 1. Sentry Integration (Error Tracking)
```typescript
// backend/src/app.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### 2. DataDog Integration (APM)
```bash
# Install DataDog agent
DD_AGENT_MAJOR_VERSION=7 \
DD_API_KEY=<YOUR_API_KEY> \
DD_SITE=datadoghq.com \
bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_agent.sh)"
```

### 3. ELK Stack (Logs)
```bash
# Deploy ELK stack
docker-compose -f infrastructure/elk-compose.yml up -d

# View logs
# Access Kibana at http://localhost:5601
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

Mukurtham Matrimony is configured with a fully automated CI/CD pipeline using **GitHub Actions** and **GitHub Container Registry (GHCR)**.

### Pipeline Workflow

Whenever you push or merge code to the `main` branch:
1. **Verify (Build & Test)**: The runner sets up Node.js, runs TypeScript type checks, starts temporary MySQL/Redis containers, runs backend unit tests, and verifies the frontend build.
2. **Build & Publish**: The runner builds the Docker images for backend and frontend, and pushes them to **GitHub Container Registry (ghcr.io)**.
3. **Deploy via SSH**: 
   - Copies `infrastructure/docker-compose.prod.yml` to the remote server directory `/opt/mukurtham`.
   - Connects to the server via SSH to pull new images, restart container services, and run database migrations.
4. **Smoke Test / Health Check**: Runs a smoke test script to verify both API and frontend are running. If it fails, it initiates an automatic rollback and database restore.

---

### 🔑 Required Repository Secrets

To activate the deployment, go to your GitHub repository:
**Settings > Secrets and variables > Actions > New repository secret** and add the following keys:

| Secret Key | Description | Example / Format |
|---|---|---|
| `PROD_SERVER_HOST` | The IP address or domain name of your production server | `198.51.100.1` |
| `PROD_SERVER_USER` | The user used to SSH into the production server | `root` or `ubuntu` |
| `PROD_SSH_KEY` | The private SSH key matching the public key authorized on the server | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SLACK_WEBHOOK` | (Optional) Slack incoming webhook URL for deploy notifications | `https://hooks.slack.com/services/...` |

---

### ⚙️ Production Server Initial Setup

Run the following once on your production server:

1. **Install Docker & Docker Compose**:
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose-v2
   ```

2. **Prepare Target Directory**:
   ```bash
   sudo mkdir -p /opt/mukurtham
   sudo chown -R $USER:$USER /opt/mukurtham
   ```

3. **Authenticate Docker with GitHub Registry**:
   To allow the server to pull private images, run:
   ```bash
   echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
   ```
   *(Create a Personal Access Token (PAT) with `read:packages` scope in GitHub settings).*

4. **Create Production `.env` File**:
   Create a `.env` file inside `/opt/mukurtham/.env` with your production database, credentials, and keys (like Stripe and Cloudinary).

Once configured, any push to `main` will automatically build, deploy, and update the website live!

---

---

## 💾 Backup & Recovery

### Automated Database Backups

```bash
#!/bin/bash
# backup.sh - Run daily via cron

BACKUP_DIR="/backups/mysql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="mukurtham_matrimony"

mysqldump -u backup_user -p$BACKUP_PASSWORD $DB_NAME > $BACKUP_DIR/backup_$TIMESTAMP.sql
gzip $BACKUP_DIR/backup_$TIMESTAMP.sql

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$TIMESTAMP.sql.gz s3://mukurtham-backups/
```

**Add to crontab:**
```bash
0 2 * * * /scripts/backup.sh
```

---

## 🚨 Performance Tuning

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_interests_created_at ON interests(created_at);

-- Full-text search index
ALTER TABLE profiles ADD FULLTEXT INDEX ft_bio (bio, about_me);
```

### Redis Caching
```typescript
// Backend - Cache strategy
const getCachedProfile = async (profileId: number) => {
  const cached = await redis.get(`profile:${profileId}`);
  if (cached) return JSON.parse(cached);
  
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  await redis.setex(`profile:${profileId}`, 3600, JSON.stringify(profile)); // 1 hour
  return profile;
};
```

### CDN for Static Assets
```typescript
// Next.js - Image optimization
import Image from 'next/image';

<Image
  src="/photos/profile.jpg"
  alt="Profile"
  width={400}
  height={400}
  priority
  loader={({ src, width }) => `https://cdn.mukurtham.com${src}?w=${width}`}
/>
```

---

## 🔍 Health Checks & Monitoring

```bash
# Check service health
curl http://localhost:8000/api/health

# Response:
# {
#   "status": "healthy",
#   "services": {
#     "database": "connected",
#     "redis": "connected"
#   },
#   "version": "1.0.0"
# }
```

---

## 📞 Support & Troubleshooting

### Common Issues

**High Memory Usage**
```bash
# Check memory usage
docker stats

# Clear Redis cache
redis-cli FLUSHDB

# Optimize database
OPTIMIZE TABLE profiles, users, photos;
```

**Database Connection Timeout**
```bash
# Increase connection pool
# In backend/.env
DATABASE_URL="mysql://user:pass@host/db?connectionLimit=20"
```

**CORS Issues**
```bash
# Update .env
CLIENT_ORIGIN="https://yourdomain.com"
```

---

## 📈 Scaling Strategy

### Horizontal Scaling
- Run multiple backend instances behind load balancer (Nginx, AWS ALB)
- Use shared database (managed RDS)
- Use shared Redis (AWS ElastiCache)

### Vertical Scaling
- Increase server CPU/RAM
- Optimize database queries
- Use caching aggressively

### Database Scaling
- Read replicas for search queries
- Sharding by region/user ID
- Archive old data to separate storage

---

*For more information, contact: devops@mukurtham.com*
