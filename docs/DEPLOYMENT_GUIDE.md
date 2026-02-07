# ComSpace Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Deploy to Vercel (Frontend) + Railway (Backend) - **Recommended**

#### Frontend (Vercel)
1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/comspace.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Set Root Directory to `frontend`
   - Add Environment Variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
     ```
   - Click "Deploy"

#### Backend (Railway)
1. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Add a MongoDB database (Railway provides this)
   - Add Environment Variables:
     ```
     NODE_ENV=production
     PORT=5000
     MONGODB_URI=(auto-filled by Railway)
     REDIS_URL=(add Redis service)
     JWT_SECRET=your-production-secret-change-this
     JWT_REFRESH_SECRET=your-refresh-secret-change-this
     FRONTEND_URL=https://your-app.vercel.app
     CORS_ORIGIN=https://your-app.vercel.app
     EMAIL_HOST=smtp.gmail.com
     EMAIL_PORT=587
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASS=your-app-password
     ```
   - Set Root Directory to `backend`
   - Railway will auto-deploy

---

### Option 2: Deploy to Heroku (Full Stack)

#### Prerequisites
```bash
npm install -g heroku
heroku login
```

#### Deploy Backend
```bash
cd backend
heroku create comspace-backend
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-here
heroku config:set FRONTEND_URL=https://comspace-frontend.herokuapp.com
git push heroku main
```

#### Deploy Frontend
```bash
cd ../frontend
heroku create comspace-frontend
heroku config:set NEXT_PUBLIC_API_URL=https://comspace-backend.herokuapp.com/api
git push heroku main
```

---

### Option 3: Deploy to AWS (Production-Ready)

#### Backend (AWS Elastic Beanstalk)
1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize and Deploy**
   ```bash
   cd backend
   eb init -p node.js comspace-backend
   eb create comspace-prod
   eb deploy
   ```

3. **Add RDS (PostgreSQL) and ElastiCache (Redis)**
   - Go to AWS Console
   - Create RDS instance
   - Create ElastiCache cluster
   - Update environment variables in EB

#### Frontend (AWS Amplify or S3 + CloudFront)
```bash
cd frontend
npm run build
# Upload .next to S3 bucket
# Configure CloudFront distribution
```

---

### Option 4: Deploy to DigitalOcean (VPS)

#### 1. Create Droplet
- Go to [digitalocean.com](https://digitalocean.com)
- Create Ubuntu 22.04 droplet
- SSH into server

#### 2. Setup Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Redis
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

#### 3. Deploy Application
```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/comspace.git
cd comspace

# Setup backend
cd backend
npm install --production
npm run build
pm2 start dist/server.js --name comspace-backend
pm2 save
pm2 startup

# Setup frontend
cd ../frontend
npm install --production
npm run build
pm2 start npm --name comspace-frontend -- start
pm2 save
```

#### 4. Configure Nginx
```nginx
# /etc/nginx/sites-available/comspace
server {
    listen 80;
    server_name yourdomain.com;

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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/comspace /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Setup SSL with Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

### Option 5: Docker Deployment

#### 1. Build Docker Images
```bash
# Backend
cd backend
docker build -t comspace-backend .

# Frontend
cd ../frontend
docker build -t comspace-frontend .
```

#### 2. Docker Compose (Production)
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  mongodb:
    image: mongo:6.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:alpine
    restart: unless-stopped

  backend:
    image: comspace-backend
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/comspace?authSource=admin
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: https://yourdomain.com
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped

  frontend:
    image: comspace-frontend
    environment:
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  mongodb_data:
```

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📝 Pre-Deployment Checklist

### Environment Variables to Set
- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI` (production database)
- [ ] `REDIS_URL` (production cache)
- [ ] `JWT_SECRET` (strong, random secret)
- [ ] `JWT_REFRESH_SECRET` (different from JWT_SECRET)
- [ ] `FRONTEND_URL` (your domain)
- [ ] `CORS_ORIGIN` (your domain)
- [ ] `EMAIL_USER` and `EMAIL_PASS` (for newsletters)
- [ ] `STRIPE_SECRET_KEY` (if using payments)
- [ ] `SENTRY_DSN` (for error tracking)

### Security Checklist
- [ ] Change all default passwords
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Enable MongoDB authentication
- [ ] Set up backup strategy
- [ ] Configure monitoring (Sentry, LogRocket)
- [ ] Set up error tracking
- [ ] Enable CORS for specific domains only

### Performance Optimization
- [ ] Enable Redis caching
- [ ] Set up CDN for static assets
- [ ] Enable gzip compression
- [ ] Optimize images
- [ ] Enable HTTP/2
- [ ] Set up database indexes
- [ ] Configure connection pooling

---

## 🔧 Post-Deployment Tasks

### 1. Database Setup
```bash
# Run migrations
npm run migrate

# Seed initial data
npm run seed

# Create admin user
npm run create-admin
```

### 2. Monitoring Setup
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Configure error tracking (Sentry)
- Set up log aggregation (Loggly, Papertrail)
- Enable performance monitoring (New Relic, DataDog)

### 3. Backup Strategy
```bash
# MongoDB backup (cron job)
0 2 * * * mongodump --uri="$MONGODB_URI" --out=/backups/$(date +\%Y-\%m-\%d)

# Backup to S3
0 3 * * * aws s3 sync /backups s3://your-backup-bucket/mongodb/
```

### 4. CI/CD Setup (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run build
      - name: Deploy to production
        run: |
          # Your deployment commands
```

---

## 🌐 Custom Domain Setup

### 1. DNS Configuration
Add these records to your DNS provider:
```
Type    Name    Value
A       @       YOUR_SERVER_IP
A       www     YOUR_SERVER_IP
CNAME   api     your-backend.railway.app
```

### 2. SSL Certificate
```bash
# Let's Encrypt (Free)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Or use Cloudflare (Free SSL + CDN)
```

---

## 📊 Monitoring & Maintenance

### Health Check Endpoints
- Backend: `https://api.yourdomain.com/health`
- Frontend: `https://yourdomain.com/api/health`

### Log Files
```bash
# View logs
pm2 logs comspace-backend
pm2 logs comspace-frontend

# Backend logs
tail -f /var/log/comspace/backend.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Database Maintenance
```bash
# MongoDB performance
mongo --eval "db.stats()"

# Rebuild indexes
mongo comspace --eval "db.products.reIndex()"

# Check slow queries
mongo comspace --eval "db.setProfilingLevel(2)"
```

---

## 🆘 Troubleshooting

### Common Issues

**1. CORS Errors**
- Check `CORS_ORIGIN` environment variable
- Ensure frontend URL is whitelisted

**2. Database Connection Fails**
- Verify `MONGODB_URI` is correct
- Check if MongoDB is running
- Ensure network allows connections

**3. Email Not Sending**
- Verify `EMAIL_USER` and `EMAIL_PASS`
- For Gmail, enable "Less secure apps" or use App Password
- Check firewall allows SMTP port 587/465

**4. High Memory Usage**
- Enable Redis caching
- Optimize database queries
- Check for memory leaks
- Increase server resources

---

## 📱 Mobile App Deployment

### Android (Google Play)
```bash
cd mobile
npm run build:android
# Upload to Play Console
```

### iOS (App Store)
```bash
cd mobile
npm run build:ios
# Upload to App Store Connect
```

---

## 💡 Best Practices

1. **Always use environment variables** - Never hardcode secrets
2. **Enable monitoring** - Know when things break
3. **Set up automated backups** - Daily database backups
4. **Use a CDN** - Faster content delivery
5. **Enable caching** - Redis for sessions and data
6. **Implement rate limiting** - Prevent abuse
7. **Keep dependencies updated** - Security patches
8. **Test before deploying** - Always run tests
9. **Use staging environment** - Test in production-like environment
10. **Document everything** - Make it easy for team

---

## 📞 Support

For deployment issues:
- Check logs first
- Review environment variables
- Verify database connections
- Test API endpoints manually
- Check server resources (CPU, memory, disk)

---

*Last Updated: February 2, 2026*
