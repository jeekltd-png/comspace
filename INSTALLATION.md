# ComSpace Installation Guide

## Quick Start (Local Development)

### Prerequisites
```bash
# Check versions
node --version  # Should be 20+
npm --version   # Should be 10+
mongod --version  # Should be 7+
redis-server --version  # Should be 7+
```

### 1. Clone and Install
```bash
# Clone repository
git clone https://github.com/your-org/comspace.git
cd comspace

# Install all dependencies
npm install
```

### 2. Start Services
```bash
# Option A: Using Docker (Recommended)
docker-compose up -d

# Option B: Manual (separate terminals)
# Terminal 1 - MongoDB
mongod --dbpath ./data/db

# Terminal 2 - Redis
redis-server

# Terminal 3 - Backend
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
npm run dev

# Terminal 4 - Frontend
cd frontend
cp .env.local.example .env.local
# Edit .env.local
npm install
npm run dev
```

### 3. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

### 4. Create Admin User
```bash
# Using MongoDB shell
mongosh

use comspace

db.users.insertOne({
  email: "admin@comspace.com",
  password: "$2a$10$...", // Hashed password
  firstName: "Admin",
  lastName: "User",
  role: "admin",
  tenant: "default",
  isVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Or use the API:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@comspace.com",
    "password": "Admin@123456",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

Then update role manually in database.

## Production Deployment

### Option 1: Docker Compose (Recommended)

```bash
# 1. Configure production environment
cp .env.example .env.production
# Edit .env.production with production values

# 2. Build and start
docker-compose -f docker-compose.prod.yml up -d

# 3. Check status
docker-compose ps

# 4. View logs
docker-compose logs -f
```

### Option 2: Cloud Deployment (AWS/DigitalOcean)

#### Backend on AWS EC2

```bash
# 1. SSH into server
ssh ubuntu@your-server-ip

# 2. Install dependencies
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 3. Clone repository
git clone https://github.com/your-org/comspace.git
cd comspace/backend

# 4. Install and build
npm install
npm run build

# 5. Configure environment
cp .env.example .env
nano .env  # Edit with production values

# 6. Start with PM2
pm2 start dist/server.js --name comspace-api
pm2 save
pm2 startup
```

#### Frontend on Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to frontend
cd frontend

# 3. Deploy
vercel --prod

# 4. Configure environment variables in Vercel dashboard
# - NEXT_PUBLIC_API_URL
# - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# - etc.
```

### Option 3: Kubernetes

```bash
# 1. Create namespace
kubectl create namespace comspace

# 2. Create secrets
kubectl create secret generic comspace-secrets \
  --from-literal=mongodb-uri='mongodb://...' \
  --from-literal=jwt-secret='...' \
  --namespace=comspace

# 3. Apply configurations
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

# 4. Check status
kubectl get pods -n comspace
```

## Database Setup

### MongoDB

#### Local
```bash
# Create data directory
mkdir -p data/db

# Start MongoDB
mongod --dbpath ./data/db

# Create database and user
mongosh
use comspace
db.createUser({
  user: "comspace",
  pwd: "secure_password",
  roles: [{ role: "readWrite", db: "comspace" }]
})
```

#### Cloud (MongoDB Atlas)
1. Create account at mongodb.com/cloud/atlas
2. Create cluster
3. Configure network access
4. Get connection string
5. Update .env with connection string

### Redis

#### Local
```bash
# Start Redis
redis-server

# Test connection
redis-cli
> ping
PONG
```

#### Cloud (Redis Cloud)
1. Create account at redis.com/try-free
2. Create database
3. Get connection details
4. Update .env with Redis URL

## Third-Party Services

### Stripe Setup
1. Create account at stripe.com
2. Get API keys from dashboard
3. Configure webhook endpoint: `https://api.yourdomain.com/api/payments/webhook`
4. Update .env:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Google Maps API
1. Go to console.cloud.google.com
2. Create project
3. Enable Maps JavaScript API and Geocoding API
4. Create API key
5. Restrict key (HTTP referrers for web, IP addresses for backend)
6. Update .env:
   ```
   GOOGLE_MAPS_API_KEY=AIza...
   ```

### Email Service (SendGrid)
1. Create account at sendgrid.com
2. Verify sender identity
3. Create API key
4. Update .env:
   ```
   SENDGRID_API_KEY=SG....
   EMAIL_FROM=noreply@yourdomain.com
   ```

### Firebase (Push Notifications)
1. Create project at console.firebase.google.com
2. Add web app and mobile apps
3. Download service account key
4. Update .env:
   ```
   FIREBASE_PROJECT_ID=...
   FIREBASE_PRIVATE_KEY=...
   FIREBASE_CLIENT_EMAIL=...
   ```

## SSL Certificate

### Using Let's Encrypt
```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificate files
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Auto-renewal
sudo certbot renew --dry-run
```

### Using Cloudflare
1. Add site to Cloudflare
2. Update nameservers at domain registrar
3. Enable "Full (strict)" SSL mode
4. Certificate managed automatically

## Nginx Configuration

```nginx
# /etc/nginx/sites-available/comspace
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

## Mobile App Deployment

### Android
```bash
cd mobile

# Configure app.json with proper package name
# Build APK
eas build --platform android

# Or build locally
npx expo build:android
```

### iOS
```bash
# Configure app.json with bundle identifier
# Build IPA
eas build --platform ios

# Or build locally
npx expo build:ios
```

### App Store Submission
1. Create developer account (Apple/Google)
2. Prepare app metadata (description, screenshots)
3. Build release version
4. Submit for review
5. Publish when approved

## Post-Installation

### 1. Initial Configuration
- Login as admin
- Configure white label settings
- Add categories
- Upload products
- Configure payment methods
- Set up email templates

### 2. Testing
- Test user registration
- Test product browsing
- Test cart and checkout
- Test payment processing (test mode first)
- Test email notifications
- Test mobile apps

### 3. Monitoring
- Set up error monitoring (Sentry)
- Configure analytics (Google Analytics)
- Set up uptime monitoring
- Configure backup schedule
- Set up log rotation

### 4. Security
- Enable HTTPS
- Configure firewall
- Set up fail2ban
- Enable rate limiting
- Regular security audits
- Keep dependencies updated

## Backup Strategy

### Database Backup
```bash
# MongoDB
mongodump --uri="mongodb://..." --out=/backup/$(date +%Y%m%d)

# Automate with cron
0 2 * * * /usr/bin/mongodump --uri="$MONGODB_URI" --out=/backup/$(date +\%Y\%m\%d)
```

### File Backup
```bash
# Backup uploads
tar -czf uploads-$(date +%Y%m%d).tar.gz /app/uploads

# Upload to S3
aws s3 cp uploads-$(date +%Y%m%d).tar.gz s3://backup-bucket/
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs comspace-api

# Check environment variables
cat .env

# Check database connection
mongosh $MONGODB_URI

# Check port availability
lsof -i :5000
```

### Frontend errors
```bash
# Check build
npm run build

# Check environment
cat .env.local

# Clear Next.js cache
rm -rf .next
npm run build
```

### Database connection issues
```bash
# Test MongoDB connection
mongosh "$MONGODB_URI"

# Check MongoDB is running
systemctl status mongod

# Check firewall
sudo ufw status
```

## Maintenance

### Updates
```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Rebuild
npm run build

# Restart services
pm2 restart comspace-api
```

### Database Migrations
```bash
# Run migrations
npm run migrate

# Rollback if needed
npm run migrate:rollback
```

## Support

- Documentation: https://docs.comspace.com
- Issues: https://github.com/your-org/comspace/issues
- Email: support@comspace.com
- Discord: https://discord.gg/comspace

## License

Proprietary - See LICENSE file
