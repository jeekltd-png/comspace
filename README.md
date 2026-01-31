# ComSpace - White Label E-Commerce Platform

A full-stack, white-label e-commerce platform supporting web and mobile applications with multicurrency payments, geolocation-based currency detection, and flexible delivery/pickup options.

## 🎯 Features

### Core Functionality
- **White Label Support**: Fully customizable branding (logos, colors, themes) per client
- **User Authentication**: Email/password, OAuth (Google, Apple), phone verification
- **Product Catalog**: Dynamic browsing with categories, search, filters, reviews
- **Shopping Cart**: Real-time calculations with taxes, shipping, currency conversion
- **Multicurrency**: Auto-detect currency based on geolocation (USD, EUR, GBP, etc.)
- **Payment Integration**: Stripe support for cards, Apple Pay, Google Pay, bank transfers
- **Delivery/Pickup**: Map-integrated address validation and store locator
- **Order Tracking**: Real-time status updates with email/push notifications
- **Admin Panel**: Product, inventory, order, user management with analytics
- **Multi-language Support**: English default with extensible localization

### Technical Highlights
- Cross-platform (Web + iOS + Android)
- PCI-compliant secure payments
- Real-time exchange rates
- Offline support (PWA)
- GDPR compliant
- Role-based access control
- Rate limiting and security

## 🏗️ Architecture

```
comspace/
├── backend/              # Node.js + Express + TypeScript API
├── frontend/             # Next.js web application
├── mobile/               # React Native mobile app
├── shared/               # Shared types and utilities
├── docs/                 # Documentation and user manual
└── infrastructure/       # Docker, CI/CD configs
```

## 🛠️ Technology Stack

### Frontend (Web)
- **Framework**: Next.js 14 with React 18
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Forms**: React Hook Form + Zod validation
- **API Client**: Axios with React Query

### Mobile
- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **State**: Redux Toolkit (shared with web)

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **Authentication**: JWT with Passport.js
- **File Storage**: AWS S3 or Cloudinary

### Payment & External Services
- **Payment**: Stripe
- **Maps**: Google Maps API
- **Currency**: ExchangeRate-API
- **Notifications**: Firebase Cloud Messaging
- **Email**: SendGrid or AWS SES

### DevOps
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Hosting**: Vercel (frontend), AWS/DigitalOcean (backend)
- **Monitoring**: Sentry
- **Analytics**: Google Analytics / Mixpanel

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 7+
- Redis 7+
- npm or yarn
- Expo CLI (for mobile)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure environment variables
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Configure environment variables
npm run dev
```

### Mobile Setup
```bash
cd mobile
npm install
cp .env.example .env
# Configure environment variables
npx expo start
```

## 📱 White Label Configuration

Edit `backend/config/white-label.json` to customize each tenant:

```json
{
  "tenants": {
    "default": {
      "name": "ComSpace",
      "logo": "/logos/default.png",
      "primaryColor": "#3B82F6",
      "secondaryColor": "#10B981",
      "domain": "comspace.com",
      "features": {
        "delivery": true,
        "pickup": true,
        "reviews": true
      }
    }
  }
}
```

## 📚 Documentation

- [User Manual](docs/USER_MANUAL.md) - End-user guide
- [Admin Guide](docs/ADMIN_GUIDE.md) - Administrator documentation
- [API Documentation](docs/API.md) - REST API reference
- [White Label Setup](docs/WHITE_LABEL.md) - Customization guide
- [Development Guide](docs/DEVELOPMENT.md) - Developer reference

## 🧪 Testing

```bash
# Run all tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 🔒 Security

- HTTPS enforced
- Data encryption at rest and in transit
- PCI DSS compliant payment processing
- Rate limiting on all endpoints
- SQL injection and XSS protection
- GDPR compliant data handling
- Regular security audits

## 📈 Performance

- Server-side rendering (SSR) with Next.js
- Redis caching for API responses
- CDN for static assets
- Image optimization
- Code splitting and lazy loading
- PWA support for offline functionality

## 📄 License

Proprietary - All rights reserved

## 🤝 Support

For support, email support@comspace.com or visit our documentation.
