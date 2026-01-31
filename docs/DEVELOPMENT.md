# Development Guide

## Prerequisites

- Node.js 20+
- MongoDB 7+
- Redis 7+
- npm or yarn
- Git

## Initial Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/comspace.git
cd comspace
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm run install --workspaces
```

### 3. Environment Configuration

#### Backend (.env)
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

#### Frontend (.env.local)
```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

### 4. Start Services

#### Using Docker
```bash
docker-compose up -d
```

#### Manual Start
```bash
# Terminal 1 - MongoDB
mongod --dbpath /path/to/data

# Terminal 2 - Redis
redis-server

# Terminal 3 - Backend
cd backend
npm run dev

# Terminal 4 - Frontend
cd frontend
npm run dev

# Terminal 5 - Mobile (optional)
cd mobile
npm start
```

## Project Structure

```
comspace/
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── utils/          # Helper functions
│   │   ├── config/         # Configuration files
│   │   └── server.ts       # Entry point
│   ├── logs/               # Application logs
│   └── package.json
│
├── frontend/               # Next.js web app
│   ├── src/
│   │   ├── app/           # Next.js pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities
│   │   ├── store/         # Redux store
│   │   └── styles/        # CSS files
│   └── package.json
│
├── mobile/                # React Native app
│   ├── src/
│   │   ├── screens/      # App screens
│   │   ├── components/   # React components
│   │   ├── navigation/   # Navigation config
│   │   └── store/        # Redux store
│   └── package.json
│
├── docs/                 # Documentation
├── docker-compose.yml    # Docker configuration
└── package.json          # Root package file
```

## Development Workflow

### Creating a New Feature

1. **Create Branch**
```bash
git checkout -b feature/feature-name
```

2. **Backend Development**
```bash
# Add model
touch backend/src/models/feature.model.ts

# Add controller
touch backend/src/controllers/feature.controller.ts

# Add routes
touch backend/src/routes/feature.routes.ts

# Update server.ts to include routes
```

3. **Frontend Development**
```bash
# Create component
touch frontend/src/components/Feature.tsx

# Create page
touch frontend/src/app/feature/page.tsx

# Add API service
# Edit frontend/src/lib/api.ts
```

4. **Test Changes**
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

5. **Commit and Push**
```bash
git add .
git commit -m "Add feature: description"
git push origin feature/feature-name
```

### Code Style

#### TypeScript
```typescript
// Use interfaces for object shapes
interface Product {
  id: string;
  name: string;
  price: number;
}

// Use const for immutable values
const TAX_RATE = 0.1;

// Use async/await, not promises
async function fetchData() {
  try {
    const result = await api.get('/data');
    return result.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
```

#### React Components
```typescript
// Use functional components
export function ProductCard({ product }: { product: Product }) {
  // Use hooks
  const [quantity, setQuantity] = useState(1);
  
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>${product.price}</p>
    </div>
  );
}
```

## Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Frontend Tests
```bash
cd frontend

# Run tests
npm test

# E2E tests
npm run test:e2e
```

### Writing Tests

#### Backend (Jest)
```typescript
import request from 'supertest';
import app from '../server';

describe('Product API', () => {
  it('should get all products', async () => {
    const response = await request(app)
      .get('/api/products')
      .expect(200);
      
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.products)).toBe(true);
  });
});
```

#### Frontend (React Testing Library)
```typescript
import { render, screen } from '@testing-library/react';
import ProductCard from './ProductCard';

describe('ProductCard', () => {
  it('renders product name', () => {
    const product = { id: '1', name: 'Test Product', price: 99.99 };
    render(<ProductCard product={product} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });
});
```

## Debugging

### Backend
```typescript
// Use logger
import { logger } from './utils/logger';

logger.info('Info message');
logger.error('Error message', error);
logger.debug('Debug message', data);
```

### Frontend
```typescript
// React DevTools
// Redux DevTools

// Console debugging
console.log('Value:', value);
console.table(arrayOfObjects);
```

### VS Code Launch Configuration
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "program": "${workspaceFolder}/backend/src/server.ts",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "sourceMaps": true
    }
  ]
}
```

## Database

### Migrations
```bash
# Create migration
npm run migration:create migration-name

# Run migrations
npm run migration:up

# Rollback
npm run migration:down
```

### Seeding
```bash
# Seed database
npm run seed

# Seed specific data
npm run seed:products
npm run seed:users
```

## API Development

### Adding New Endpoint

1. **Define Model**
```typescript
// models/feature.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IFeature extends Document {
  name: string;
  description: string;
}

const FeatureSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: String,
}, { timestamps: true });

export default mongoose.model<IFeature>('Feature', FeatureSchema);
```

2. **Create Controller**
```typescript
// controllers/feature.controller.ts
import { Request, Response, NextFunction } from 'express';
import Feature from '../models/feature.model';

export const getFeatures = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const features = await Feature.find();
    res.status(200).json({ success: true, data: { features } });
  } catch (error) {
    next(error);
  }
};
```

3. **Define Routes**
```typescript
// routes/feature.routes.ts
import { Router } from 'express';
import { getFeatures } from '../controllers/feature.controller';

const router = Router();
router.get('/', getFeatures);

export default router;
```

4. **Register Routes**
```typescript
// server.ts
import featureRoutes from './routes/feature.routes';
app.use('/api/features', featureRoutes);
```

## Deployment

### Production Build

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build

# Mobile
cd mobile
npm run build:android
npm run build:ios
```

### Environment Variables

Ensure all production environment variables are set:
- Database credentials
- API keys (Stripe, Google Maps, etc.)
- JWT secrets
- CORS origins
- Email service credentials

### Docker Deployment

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f
```

## Best Practices

### Security
- Never commit sensitive data
- Use environment variables
- Validate all input
- Sanitize user data
- Use parameterized queries
- Implement rate limiting
- Keep dependencies updated

### Performance
- Use caching (Redis)
- Optimize database queries
- Use indexes
- Lazy load components
- Minimize bundle size
- Use CDN for assets
- Enable compression

### Code Quality
- Follow TypeScript best practices
- Write meaningful comments
- Keep functions small
- Use descriptive names
- Handle errors properly
- Write tests
- Review code before merging

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Check MongoDB is running
- Verify connection string
- Check network/firewall

**Redis Connection Failed**
- Ensure Redis is running
- Check Redis URL
- Verify port (default: 6379)

**Port Already in Use**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

**Module Not Found**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Resources

- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Next.js Docs](https://nextjs.org/docs)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Stripe API](https://stripe.com/docs/api)
