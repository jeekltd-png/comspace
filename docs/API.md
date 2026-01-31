# ComSpace API Documentation

## Base URL
```
Production: https://api.comspace.com/api
Development: http://localhost:5000/api
```

## Authentication

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}

Response: 201 Created
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": "...", "email": "...", "firstName": "...", "lastName": "...", "role": "customer" },
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": {...},
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response: 200 OK
{
  "success": true,
  "data": {
    "token": "new_token",
    "refreshToken": "new_refresh_token"
  }
}
```

## Products

### List Products
```http
GET /products?page=1&limit=20&category=electronics&minPrice=10&maxPrice=100&sort=-createdAt
Authorization: Bearer <token> (optional)

Response: 200 OK
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### Get Product
```http
GET /products/:id
Authorization: Bearer <token> (optional)

Response: 200 OK
{
  "success": true,
  "data": {
    "product": {
      "_id": "...",
      "name": "Product Name",
      "description": "...",
      "basePrice": 99.99,
      "currency": "USD",
      "images": [...],
      "stock": 50,
      "rating": { "average": 4.5, "count": 123 }
    }
  }
}
```

### Create Product (Admin)
```http
POST /products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "New Product",
  "description": "Product description",
  "shortDescription": "Brief description",
  "sku": "PROD-001",
  "category": "category_id",
  "basePrice": 99.99,
  "stock": 100,
  "images": [
    { "url": "https://...", "alt": "Product image", "isPrimary": true }
  ],
  "tags": ["electronics", "gadgets"]
}

Response: 201 Created
```

## Cart

### Get Cart
```http
GET /cart
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "cart": {
      "items": [
        {
          "product": {...},
          "quantity": 2,
          "price": 99.99,
          "currency": "USD"
        }
      ]
    }
  }
}
```

### Add to Cart
```http
POST /cart/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product_id",
  "quantity": 2,
  "variant": "Large/Red"
}

Response: 200 OK
```

### Update Cart Item
```http
PUT /cart/items/:productId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}

Response: 200 OK
```

### Remove from Cart
```http
DELETE /cart/items/:productId
Authorization: Bearer <token>

Response: 200 OK
```

## Orders

### Create Order
```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "fulfillmentType": "delivery",
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA"
  },
  "notes": "Leave at door"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "order": {
      "orderNumber": "ORD-123456",
      "total": 109.99,
      "status": "pending"
    }
  }
}
```

### Get Orders
```http
GET /orders?page=1&limit=10&status=shipped
Authorization: Bearer <token>

Response: 200 OK
```

### Get Order Details
```http
GET /orders/:id
Authorization: Bearer <token>

Response: 200 OK
```

### Cancel Order
```http
POST /orders/:id/cancel
Authorization: Bearer <token>

Response: 200 OK
```

## Payment

### Create Payment Intent
```http
POST /payments/intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 109.99,
  "currency": "USD",
  "orderId": "order_id"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "clientSecret": "pi_..._secret_...",
    "paymentIntentId": "pi_..."
  }
}
```

### Confirm Payment
```http
POST /payments/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentIntentId": "pi_..."
}

Response: 200 OK
```

## Currency

### Get Exchange Rates
```http
GET /currency/rates?base=USD

Response: 200 OK
{
  "success": true,
  "data": {
    "base": "USD",
    "rates": {
      "EUR": 0.85,
      "GBP": 0.73,
      "JPY": 110.5
    },
    "timestamp": 1642512000
  }
}
```

### Convert Currency
```http
POST /currency/convert
Content-Type: application/json

{
  "amount": 100,
  "from": "USD",
  "to": "EUR"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "amount": 100,
    "from": "USD",
    "to": "EUR",
    "rate": 0.85,
    "convertedAmount": 85.00
  }
}
```

## Location

### Detect Location
```http
POST /location/detect
Content-Type: application/json

{
  "ip": "8.8.8.8"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "country": "United States",
    "countryCode": "US",
    "city": "Mountain View",
    "currency": "USD",
    "coordinates": {
      "lat": 37.4056,
      "lng": -122.0775
    }
  }
}
```

### Get Nearby Stores
```http
GET /location/stores/nearby?lat=40.7128&lng=-74.0060&radius=10000

Response: 200 OK
{
  "success": true,
  "data": {
    "stores": [...]
  }
}
```

## Admin

### Dashboard Stats
```http
GET /admin/dashboard
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 1234,
      "totalOrders": 5678,
      "totalProducts": 890,
      "totalRevenue": 123456.78
    },
    "recentOrders": [...]
  }
}
```

### Sales Report
```http
GET /admin/reports/sales?startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "success": true,
  "data": {
    "salesData": [
      {
        "_id": "2026-01-01",
        "totalSales": 1234.56,
        "orderCount": 15
      }
    ]
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "status": "fail",
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "status": "fail",
  "message": "Not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "status": "fail",
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "status": "error",
  "message": "Something went wrong"
}
```

## Rate Limiting

- **General**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Headers

### Required
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (for protected routes)

### Optional
- `X-Tenant-ID: <tenant_id>` (for mobile apps)

## Pagination

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## Sorting

Use `sort` query parameter:
- `-createdAt`: Newest first
- `createdAt`: Oldest first
- `-price`: Highest price first
- `price`: Lowest price first
- `-rating.average`: Highest rated first

## Filtering

Available filters vary by endpoint. Common filters:
- `category`: Filter by category ID
- `minPrice`, `maxPrice`: Price range
- `status`: Filter by status
- `search`: Text search

## Webhooks

Subscribe to events:
- `order.created`
- `order.shipped`
- `order.delivered`
- `payment.completed`
- `payment.failed`

Webhook payload:
```json
{
  "event": "order.created",
  "timestamp": "2026-01-15T10:30:00Z",
  "data": {
    "orderId": "...",
    "orderNumber": "ORD-123456",
    ...
  }
}
```
