# White Label Setup Guide

## Overview

ComSpace's white label solution allows you to rebrand and customize the e-commerce platform for multiple clients, each with their own unique branding, domain, and configuration.

## What is White Labeling?

**White labeling** is the practice of rebranding a product or service to appear as if it was created by a different company. In ComSpace:

- **One Platform, Many Brands**: Single codebase powers multiple branded stores
- **Custom Branding**: Each client has unique logos, colors, and styling
- **Separate Domains**: Each client can use their own domain
- **Feature Control**: Enable/disable features per client
- **Independent Data**: Each tenant's data is isolated
- **Scalable**: Add unlimited tenants

## Benefits

### For Platform Owners
- **Revenue Stream**: License platform to multiple clients
- **Scalability**: Manage multiple stores from one admin
- **Lower Costs**: One codebase to maintain
- **Faster Deployment**: New clients online in minutes

### For Clients
- **Professional Platform**: Enterprise-grade e-commerce
- **Custom Branding**: Looks like their own platform
- **Quick Launch**: Skip development time
- **Full Features**: All platform capabilities
- **Support Included**: Technical support provided

## Architecture

### Multi-Tenancy Model
```
Platform
├── Tenant: default (master)
│   ├── Domain: comspace.com
│   ├── Products, Users, Orders
│   └── Branding
├── Tenant: client1
│   ├── Domain: client1.com
│   ├── Products, Users, Orders
│   └── Branding
└── Tenant: client2
    ├── Domain: client2.com
    ├── Products, Users, Orders
    └── Branding
```

### Data Isolation
- Each tenant has isolated database records
- Tenant ID stored with every record
- Middleware enforces tenant separation
- No cross-tenant data leakage

## Setup Process

### Step 1: Create Tenant Configuration

Create a new white label configuration:

```bash
# Using API
POST /api/admin/white-label/config

{
  "tenantId": "acme-store",
  "name": "ACME Store",
  "domain": "acme-store.com",
  "branding": {
    "logo": "https://cdn.acme.com/logo.png",
    "favicon": "https://cdn.acme.com/favicon.ico",
    "primaryColor": "#FF6B6B",
    "secondaryColor": "#4ECDC4",
    "accentColor": "#FFD93D",
    "fontFamily": "Montserrat, sans-serif"
  },
  "features": {
    "delivery": true,
    "pickup": true,
    "reviews": true,
    "wishlist": true,
    "chat": false,
    "socialLogin": true
  },
  "payment": {
    "stripeAccountId": "acct_xxxxx",
    "supportedMethods": ["card", "apple_pay", "google_pay"],
    "currencies": ["USD", "EUR", "GBP"]
  },
  "contact": {
    "email": "support@acme-store.com",
    "phone": "+1-555-ACME",
    "address": "123 ACME Street, City, State 12345"
  },
  "seo": {
    "title": "ACME Store - Quality Products",
    "description": "Shop quality products at ACME Store",
    "keywords": ["products", "shopping", "acme"]
  }
}
```

### Step 2: Configure DNS

Point the custom domain to your platform:

```
Type: CNAME
Name: @
Value: platform.comspace.com
TTL: 3600

Type: CNAME
Name: www
Value: platform.comspace.com
TTL: 3600
```

For naked domain (no www):
```
Type: A
Name: @
Value: 123.456.789.0 (platform IP)
```

### Step 3: SSL Certificate

SSL certificates are automatically provisioned via Let's Encrypt:

1. DNS must be properly configured
2. Certificate issued within minutes
3. Auto-renewal every 90 days
4. HTTPS enforced automatically

### Step 4: Import Data (Optional)

Import initial data for the tenant:

```bash
# Products
POST /api/admin/products/import
Headers: X-Tenant-ID: acme-store
Body: CSV/JSON file

# Categories
POST /api/admin/categories/import
Headers: X-Tenant-ID: acme-store

# Users (if migrating)
POST /api/admin/users/import
Headers: X-Tenant-ID: acme-store
```

### Step 5: Configure Payment Gateway

Each tenant needs their own Stripe account:

1. Client creates Stripe account
2. Complete Stripe onboarding
3. Get Stripe Account ID
4. Add to tenant configuration
5. Configure webhook endpoint:
   ```
   https://api.comspace.com/payments/webhook
   Headers: X-Tenant-ID: acme-store
   ```

### Step 6: Customize Branding

#### Logo Requirements
- Format: PNG or SVG
- Recommended: 200x60px (or ratio)
- Transparent background
- Light and dark versions

#### Color Scheme
- **Primary**: Main brand color (buttons, links)
- **Secondary**: Supporting color (accents)
- **Accent**: Highlights and CTAs

#### Fonts
- Choose from Google Fonts
- Or provide custom font files
- Specify font-family name

#### Custom CSS (Advanced)
```css
/* Override specific styles */
.product-card {
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.button-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Custom header */
.site-header {
  background-color: var(--primary-color);
  padding: 1rem 0;
}
```

### Step 7: Test Tenant

Before going live:

1. **Access Check**
   - Visit custom domain
   - Verify logo and colors
   - Check all pages

2. **Feature Testing**
   - Browse products
   - Add to cart
   - Checkout process
   - Payment (test mode)
   - Order tracking

3. **Mobile Testing**
   - iOS app
   - Android app
   - Responsive web

4. **Email Testing**
   - Registration email
   - Order confirmation
   - Shipping notification
   - Password reset

5. **Currency Testing**
   - Test different currencies
   - Verify conversion rates
   - Check payment processing

### Step 8: Go Live

When ready to launch:

1. Switch Stripe to live mode
2. Update payment keys
3. Turn off test mode
4. Enable production features
5. Monitor for issues

## Management

### Via Admin Dashboard

1. Login as platform admin
2. Navigate to **White Label** section
3. Select tenant
4. View/edit configuration
5. Monitor activity

### Via API

All operations available via REST API:

```javascript
// Get tenant config
GET /api/white-label/config
Headers: X-Tenant-ID: acme-store

// Update branding
PUT /api/white-label/config/acme-store
Body: { branding: { primaryColor: "#FF0000" } }

// Deactivate tenant
PATCH /api/white-label/config/acme-store
Body: { isActive: false }
```

## Pricing Models

### Option 1: License Fee
- Monthly/annual fee per tenant
- Flat rate regardless of usage
- Predictable revenue

### Option 2: Revenue Share
- Percentage of tenant's sales
- Example: 5% of all transactions
- Scales with success

### Option 3: Hybrid
- Base license fee + small percentage
- Example: $99/month + 2% of sales
- Balanced approach

### Option 4: Tiered
- Different tiers based on features
- Basic, Professional, Enterprise
- More features = higher price

## Technical Details

### Tenant Detection

Platform detects tenant via:

1. **Domain**: Primary method
   ```javascript
   const host = req.get('host'); // 'acme-store.com'
   const tenant = await getTenantByDomain(host);
   ```

2. **Header**: Mobile apps use header
   ```javascript
   const tenantId = req.get('X-Tenant-ID'); // 'acme-store'
   ```

3. **Subdomain**: Alternative method
   ```javascript
   const subdomain = host.split('.')[0]; // 'acme' from 'acme.comspace.com'
   ```

### Database Queries

All queries filtered by tenant:

```javascript
// Automatic tenant filtering
const products = await Product.find({
  tenant: req.tenant, // Added by middleware
  isActive: true
});

// Users isolated by tenant
const user = await User.findOne({
  email: email,
  tenant: req.tenant
});
```

### Caching

Tenant config cached for performance:

```javascript
// Redis cache
const cacheKey = `tenant:${tenantId}`;
let config = await redis.get(cacheKey);

if (!config) {
  config = await WhiteLabel.findOne({ tenantId });
  await redis.setex(cacheKey, 3600, JSON.stringify(config));
}
```

### Asset Delivery

Tenant-specific assets served via CDN:

```
https://cdn.comspace.com/tenants/acme-store/logo.png
https://cdn.comspace.com/tenants/acme-store/favicon.ico
```

## Advanced Customization

### Custom Email Templates

Override default templates:

```html
<!-- tenants/acme-store/email-templates/order-confirmation.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: {{ fontFamily }}; }
    .header { background: {{ primaryColor }}; }
  </style>
</head>
<body>
  <div class="header">
    <img src="{{ logo }}" alt="{{ storeName }}">
  </div>
  <h1>Order Confirmed!</h1>
  <p>Thank you for your order #{{ orderNumber }}</p>
  <!-- Template content -->
</body>
</html>
```

### Custom Pages

Add tenant-specific pages:

```javascript
// tenants/acme-store/pages/about.md
# About ACME Store

We are a family-owned business...
```

### Webhooks

Send events to tenant systems:

```javascript
// Configure webhook URL
{
  "webhooks": {
    "orderCreated": "https://acme-store.com/api/webhook/order",
    "orderShipped": "https://acme-store.com/api/webhook/shipped"
  }
}

// Automatically called on events
POST https://acme-store.com/api/webhook/order
Body: {
  "event": "order.created",
  "data": { /* order object */ }
}
```

## Monitoring

### Health Checks

Monitor each tenant:

```bash
# Tenant-specific health
GET /health?tenant=acme-store

Response:
{
  "status": "healthy",
  "tenant": "acme-store",
  "uptime": 99.99,
  "lastOrder": "2026-01-15T10:30:00Z",
  "activeUsers": 234
}
```

### Analytics Dashboard

Platform-wide analytics:

- Active tenants
- Revenue per tenant
- Orders per tenant
- User growth
- System health

### Alerts

Set up alerts for:

- Tenant downtime
- Payment failures
- High error rates
- Low stock alerts
- Security issues

## Security Considerations

### Data Isolation
- Tenant ID validated on every request
- Database-level tenant filtering
- No cross-tenant queries possible
- Regular security audits

### Access Control
- Platform admin: Access all tenants
- Tenant admin: Only their tenant
- Customers: Only their data

### API Keys
- Separate keys per tenant
- Encrypted storage
- Regular rotation
- Usage monitoring

## Support & Maintenance

### Tenant Onboarding
1. Initial consultation
2. Gather requirements
3. Configure tenant
4. Import data
5. Training session
6. Go live support

### Ongoing Support
- Technical support
- Platform updates
- Feature requests
- Bug fixes
- Performance optimization

### Documentation
- Tenant-specific docs
- API documentation
- Video tutorials
- Knowledge base
- Community forum

## Migration

### From Existing Platform

1. **Data Export**
   - Export products (CSV)
   - Export customers
   - Export orders

2. **Data Mapping**
   - Map fields to ComSpace schema
   - Handle custom fields
   - Prepare images

3. **Import**
   - Use import API
   - Validate data
   - Fix errors

4. **Testing**
   - Verify all data
   - Test functionality
   - Customer communication

5. **Go Live**
   - DNS cutover
   - Monitor closely
   - Support team ready

## Best Practices

### Setup
- Plan branding carefully
- Test thoroughly before launch
- Have support team ready
- Document customizations
- Keep backups

### Management
- Regular updates
- Monitor performance
- Review analytics
- Gather feedback
- Continuous improvement

### Growth
- Start with few tenants
- Perfect the process
- Scale gradually
- Automate where possible
- Build relationships

## Troubleshooting

### Domain Not Working
- Verify DNS configuration
- Check propagation (24-48 hours)
- Confirm SSL certificate
- Test with dig/nslookup

### Wrong Branding Showing
- Clear cache
- Check tenant configuration
- Verify domain mapping
- Review CDN settings

### Payment Issues
- Confirm Stripe keys
- Check webhook endpoints
- Verify account status
- Test mode vs live mode

## Resources

- [API Documentation](API.md)
- [Development Guide](DEVELOPMENT.md)
- [Security Guide](SECURITY.md)
- [Support Portal](https://support.comspace.com)

---

**Questions?** Contact: white-label@comspace.com
