# Production Infrastructure Setup

## 1. MongoDB Atlas (Managed Database)

### Setup
1. Create a free account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new **Shared Cluster** (M0 free tier for staging, M10+ for production)
3. Choose a region close to your deployment (e.g., AWS us-east-1)

### Security
- **Network Access**: Whitelist only your server IPs (or use VPC Peering for cloud deployments)
- **Database User**: Create a dedicated user with `readWrite` role on the `comspace` database — never use the admin account
- **Connection String**: Use SRV format:
  ```
  mongodb+srv://<user>:<password>@<cluster>.mongodb.net/comspace?retryWrites=true&w=majority
  ```

### Backups
- Atlas provides automatic daily backups on M10+
- For M0/M2/M5, use the included `scripts/mongo-backup.sh`:
  ```bash
  MONGODB_URI="mongodb+srv://..." ./scripts/mongo-backup.sh
  ```

### Indexes
All indexes are created automatically by Mongoose schema definitions. Verify with:
```bash
mongosh "<connection-string>" --eval "db.getCollectionNames().forEach(c => { print('---' + c); printjson(db[c].getIndexes()) })"
```

---

## 2. Redis (Managed)

### Options (Recommended)
| Provider       | Free Tier | Notes |
|---------------|-----------|-------|
| **Upstash**    | 10K cmd/day | Serverless, great for low-traffic |
| **Redis Cloud** | 30 MB | By Redis Labs |
| **AWS ElastiCache** | None | For high-traffic; requires VPC |
| **Railway**    | $5/mo | Simple setup |

### Setup (Upstash Example)
1. Create account at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the connection URL:
   ```
   redis://default:<password>@<host>:<port>
   ```
4. Set `REDIS_URL` in your `.env`

### What Redis Is Used For
- **Rate limiting**: API abuse protection (express-rate-limit + rate-limit-redis)
- **Session caching**: Temporary session data
- **Feature flags**: Hot-reloadable configuration

### Verify Connection
```bash
redis-cli -u "redis://default:<password>@<host>:<port>" ping
# Expected response: PONG
```

---

## 3. Deployment Checklist

### Before First Deploy
- [ ] MongoDB Atlas cluster created and connection string tested
- [ ] Redis instance created and `PING` returns `PONG`
- [ ] All `.env.production.template` variables filled in
- [ ] SMTP credentials verified (`npx ts-node -e "require('./src/utils/email.service').verifySmtp()"`)
- [ ] Stripe webhook secret set (`STRIPE_WEBHOOK_SECRET`)
- [ ] SSL certificate configured (nginx or cloud provider)
- [ ] `CORS_ORIGIN` set to production frontend URL only

### DNS Setup
| Record | Host | Value |
|--------|------|-------|
| A or CNAME | `yourdomain.com` | Server IP / Load balancer |
| A or CNAME | `api.yourdomain.com` | Backend server IP |

### Health Checks
- Backend: `GET /api/health` → `{ "status": "ok", "db": "connected", "redis": "connected" }`
- Frontend: `GET /` → 200 OK with HTML

---

## 4. Docker Compose (Production)

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# Check logs
docker compose -f docker-compose.prod.yml logs -f backend

# Restart only backend
docker compose -f docker-compose.prod.yml restart backend
```

---

## 5. Kubernetes (Advanced)

See `k8s/` directory for manifests. Apply with:
```bash
kubectl apply -f k8s/config.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

---

## 6. Monitoring

### Recommended Stack
- **Sentry**: Error tracking (set `SENTRY_DSN` in `.env`)
- **UptimeRobot**: Free uptime monitoring for `/api/health`
- **MongoDB Atlas Alerts**: Set up alerts for high CPU, low disk space
- **Upstash Console**: Monitor Redis usage and latency
