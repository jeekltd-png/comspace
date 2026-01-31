# Installation Instructions

Follow these steps to install dependencies and run the ComSpace platform with multi-language support.

## Prerequisites

- Node.js 20+
- MongoDB 7+
- Redis 7+
- Docker (optional)

## Quick Start

### 1. Install All Dependencies

From the root directory:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install mobile dependencies
cd ../mobile
npm install
```

### 2. Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/comspace
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
STRIPE_SECRET_KEY=sk_test_your_stripe_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
SENDGRID_API_KEY=your_sendgrid_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
APPLE_CLIENT_ID=your_apple_oauth_client_id
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

#### Mobile (.env)
```env
API_URL=http://localhost:5000/api
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

### 3. Start Services

#### Using Docker (Recommended)
```bash
docker-compose up -d
```

#### Manual Start

**Terminal 1 - Start MongoDB & Redis:**
```bash
# MongoDB
mongod

# Redis (in another terminal)
redis-server
```

**Terminal 2 - Start Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Start Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 4 - Start Mobile:**
```bash
cd mobile
npm start
```

### 4. Access Applications

- **Backend API**: http://localhost:5000
- **Frontend Web**: http://localhost:3000
- **Mobile**: Scan QR code in Expo Go app

## Multi-Language Setup

All language files are already created in:
- `backend/src/locales/{lang}/translation.json`
- `frontend/src/locales/{lang}.json`
- `mobile/src/i18n/locales/{lang}.json`

Supported languages:
- English (en) - Default
- Spanish (es)
- French (fr)
- Arabic (ar)
- German (de)

### Test Language Switching

**Backend API:**
```bash
curl -H "Accept-Language: es" http://localhost:5000/api/products
```

**Frontend:**
- Click the language switcher in the header
- Or visit: http://localhost:3000/es

**Mobile:**
- Go to Profile screen
- Tap on Language setting
- Select your preferred language

## Next Steps

1. **Configure Payment**: Add your Stripe keys
2. **Setup Email**: Configure SendGrid for transactional emails
3. **Add Products**: Use admin panel to add products
4. **Test Multi-Language**: Switch between languages
5. **Configure White Label**: Setup your first tenant

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

### Redis Connection Issues
```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port in .env
PORT=5001
```

### Language Not Switching
1. Clear browser cookies
2. Check if translation file exists for that language
3. Restart the development server

## Production Deployment

See [INSTALLATION.md](INSTALLATION.md) for detailed production deployment instructions.

---

**Setup Date**: January 16, 2026  
**Version**: 1.0.0
