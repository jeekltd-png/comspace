# 🏪 White Label System - Complete Guide

## 📋 Table of Contents
- [What is White Label?](#what-is-white-label)
- [How It Works](#how-it-works)
- [User Types & Roles](#user-types--roles)
- [Creating Your Own Store](#creating-your-own-store)
- [Managing Your Content](#managing-your-content)
- [Custom Branding](#custom-branding)
- [Technical Architecture](#technical-architecture)
- [API Reference](#api-reference)

---

## 🎯 What is White Label?

**White Label** is a business model where you can create your **own branded e-commerce store** using ComSpace's platform infrastructure. Think of it as:

### 🏪 **Your Own Store, Your Brand**
- **Your domain**: `yourbusiness.com` (not `comspace.com/yourbusiness`)
- **Your logo**: Display your company logo and brand colors
- **Your content**: Add products, categories, and content with your unique credentials
- **Your customers**: Build and manage your own customer base
- **Your payments**: Receive payments directly to your Stripe account

### 🎨 **Examples:**
1. **Fashion Boutique Owner** → Creates `fashionboutique.com` with luxury branding
2. **Electronics Store** → Creates `techgadgets.com` with modern tech theme
3. **Organic Farm** → Creates `organicfarm.com` with green, natural branding
4. **Multiple Store Chains** → Each location gets its own branded subdomain

---

## 🔄 How It Works

### **Multi-Tenant Architecture**

ComSpace uses a **multi-tenant system** where multiple businesses share the same infrastructure but have completely isolated data:

```
┌─────────────────────────────────────────┐
│         ComSpace Platform               │
│  ┌────────────────────────────────────┐ │
│  │  Shared Infrastructure             │ │
│  │  - Database                        │ │
│  │  - Server                          │ │
│  │  - Storage                         │ │
│  │  - Payment Processing              │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌─────────────┐  ┌─────────────┐     │
│  │ Tenant A    │  │ Tenant B    │     │
│  │ store-a.com │  │ store-b.com │     │
│  │             │  │             │     │
│  │ • Products  │  │ • Products  │     │
│  │ • Customers │  │ • Customers │     │
│  │ • Orders    │  │ • Orders    │     │
│  │ • Branding  │  │ • Branding  │     │
│  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────┘
```

### **Key Concepts:**

#### 🆔 **Tenant ID**
- Unique identifier for your business (e.g., `fashion-boutique-2026`)
- Automatically assigned when you create your store
- Used internally to separate your data from other stores
- Never visible to your customers

#### 🌐 **Domain/Subdomain**
- Your public-facing address
- **Custom Domain**: `yourbusiness.com` (requires DNS setup)
- **Subdomain**: `yourbusiness.comspace.io` (instant setup)

#### 🎨 **Branding Profile**
- Logo, colors, fonts
- Contact information
- Social media links
- SEO settings

#### 📦 **Isolated Data**
- Your products, customers, and orders are 100% private
- Other tenants cannot see or access your data
- You only manage your own content

---

## 👥 User Types & Roles

### **1. Platform Admin (ComSpace Team)**
**Role**: Manage the entire platform
- Approve new store registrations
- Monitor system health
- Handle billing and subscriptions
- Provide technical support

**Cannot**:
- See individual store's customer data
- Access store admin dashboards
- Manage store products directly

---

### **2. Store Owner (Business User)**
**Role**: Create and manage their own white-label store

#### **How to Become a Store Owner:**

**Step 1: Sign Up**
```http
POST /api/auth/register
{
  "email": "owner@yourbusiness.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "business-owner"
}
```

**Step 2: Create Store Configuration**
```http
POST /api/white-label
{
  "tenantId": "your-unique-store-id",
  "name": "Your Business Name",
  "domain": "yourbusiness.comspace.io",
  "branding": {
    "logo": "https://yourcdn.com/logo.png",
    "primaryColor": "#FF6B6B",
    "secondaryColor": "#4ECDC4",
    "fontFamily": "Poppins, sans-serif"
  },
  "contact": {
    "email": "support@yourbusiness.com",
    "phone": "+234-800-1234-567"
  }
}
```

#### **Store Owner Permissions:**
✅ **Full Control of Their Store:**
- Create/edit/delete products
- Manage categories
- View and process orders
- Manage customers
- Configure store settings
- Upload images and content
- Set pricing and inventory
- Enable/disable features (delivery, pickup, reviews)
- View sales analytics
- Export reports

❌ **Cannot:**
- Access other stores' data
- Modify platform settings
- See other store owners' information

---

### **3. Store Staff (Optional)**
**Role**: Employees who help manage the store

Store owners can invite staff members:
```http
POST /api/users/invite
{
  "email": "staff@yourbusiness.com",
  "role": "store-staff",
  "tenantId": "your-store-id",
  "permissions": ["manage-products", "view-orders"]
}
```

#### **Staff Permissions (Configurable):**
- **Basic**: View products and orders
- **Manager**: Add/edit products, process orders
- **Admin**: Full access except billing

---

### **4. Customers (End Users)**
**Role**: Shop on individual stores

- Register on specific stores (e.g., `fashionboutique.com`)
- Cannot access other stores with same credentials
- Each store maintains separate customer accounts
- Customers don't know they're using ComSpace infrastructure

---

## 🚀 Creating Your Own Store

### **Complete Setup Flow**

#### **Phase 1: Registration (5 minutes)**

1. **Sign Up as Business User**
   - Go to: `https://comspace.io/register/business`
   - Fill in your details:
     ```
     Business Name: Fashion Boutique Lagos
     Email: admin@fashionboutique.com
     Password: ********
     Phone: +234-800-123-4567
     Country: Nigeria
     Currency: NGN (₦)
     ```

2. **Choose Subscription Plan**
   - **Starter**: $29/month - 100 products, basic features
   - **Professional**: $79/month - 1000 products, advanced features
   - **Enterprise**: $199/month - Unlimited, priority support

3. **Choose Domain Type**
   - **Subdomain** (Free): `fashionboutique.comspace.io`
   - **Custom Domain** ($10/month): `fashionboutique.com`

#### **Phase 2: Store Configuration (10 minutes)**

1. **Upload Branding**
   ```javascript
   // Upload logo
   POST /api/white-label/branding/logo
   Content-Type: multipart/form-data
   
   {
     logo: [file],
     favicon: [file]
   }
   ```

2. **Configure Colors**
   ```javascript
   PUT /api/white-label/your-tenant-id
   {
     "branding": {
       "primaryColor": "#FF1493",    // Hot Pink
       "secondaryColor": "#000000",  // Black
       "accentColor": "#FFD700",     // Gold
       "fontFamily": "Playfair Display, serif"
     }
   }
   ```

3. **Set Contact Info**
   ```javascript
   {
     "contact": {
       "email": "support@fashionboutique.com",
       "phone": "+234-800-123-4567",
       "address": "123 Victoria Island, Lagos"
     },
     "social": {
       "instagram": "@fashionboutiquelagos",
       "facebook": "fashionboutiquelagos",
       "twitter": "@fblagos"
     }
   }
   ```

4. **Configure Features**
   ```javascript
   {
     "features": {
       "delivery": true,
       "pickup": true,
       "reviews": true,
       "wishlist": true,
       "chat": true,
       "socialLogin": true
     }
   }
   ```

#### **Phase 3: Content Setup (30 minutes)**

1. **Create Categories**
   ```javascript
   POST /api/categories
   Headers: {
     "X-Tenant-ID": "fashion-boutique-lagos",
     "Authorization": "Bearer your-token"
   }
   {
     "name": "Women's Dresses",
     "slug": "womens-dresses",
     "description": "Beautiful dresses for every occasion",
     "image": "https://cdn.fashionboutique.com/categories/dresses.jpg"
   }
   ```

2. **Add Products**
   ```javascript
   POST /api/products
   Headers: {
     "X-Tenant-ID": "fashion-boutique-lagos",
     "Authorization": "Bearer your-token"
   }
   {
     "name": {
       "en": "Elegant Evening Dress",
       "fr": "Robe de Soirée Élégante",
       "yo": "Aṣọ Alẹ Ti O Lẹwa"
     },
     "description": {
       "en": "Perfect for special occasions",
       "fr": "Parfait pour les occasions spéciales",
       "yo": "Pe fun awọn iṣẹlẹ pataki"
     },
     "price": 25000,  // ₦25,000
     "currency": "NGN",
     "category": "womens-dresses",
     "images": [
       "https://cdn.fashionboutique.com/products/dress-001-1.jpg",
       "https://cdn.fashionboutique.com/products/dress-001-2.jpg"
     ],
     "inventory": 50,
     "sku": "DRESS-EVE-001",
     "tenant": "fashion-boutique-lagos"
   }
   ```

3. **Set Shipping Options**
   ```javascript
   POST /api/shipping/zones
   {
     "name": "Lagos Mainland",
     "deliveryFee": 1500,
     "estimatedDays": "1-2 days",
     "areas": ["Yaba", "Surulere", "Ikeja"]
   }
   ```

#### **Phase 4: Payment Setup (15 minutes)**

1. **Connect Stripe Account**
   ```javascript
   POST /api/white-label/payment/connect
   {
     "stripeAccountId": "acct_1234567890",
     "supportedMethods": ["card", "bank_transfer", "ussd"],
     "currencies": ["NGN", "USD", "EUR"]
   }
   ```

2. **Configure Payment Methods**
   - Credit/Debit Cards ✅
   - Bank Transfer ✅
   - USSD Payment ✅
   - Cash on Delivery ✅
   - Pay on Pickup ✅

#### **Phase 5: Launch (5 minutes)**

1. **Preview Your Store**
   - Visit: `https://fashionboutique.comspace.io`
   - Test all features
   - Place test order

2. **Go Live**
   ```javascript
   PUT /api/white-label/fashion-boutique-lagos
   {
     "isActive": true
   }
   ```

3. **Announce Launch**
   - Share on social media
   - Send email to customers
   - Start marketing

---

## 📝 Managing Your Content

### **Dashboard Access**

1. **Login to Your Store Admin**
   ```
   URL: https://fashionboutique.comspace.io/admin
   Email: admin@fashionboutique.com
   Password: ********
   ```

2. **Admin Panel Features**
   ```
   📊 Dashboard
      ├── Sales Overview
      ├── Recent Orders
      ├── Low Stock Alerts
      └── Customer Statistics
   
   📦 Products
      ├── Add New Product
      ├── Manage Inventory
      ├── Bulk Upload (CSV)
      └── Product Categories
   
   🛒 Orders
      ├── Pending Orders
      ├── Processing
      ├── Shipped
      └── Completed
   
   👥 Customers
      ├── Customer List
      ├── Customer Groups
      └── Loyalty Programs
   
   ⚙️ Settings
      ├── Store Information
      ├── Branding
      ├── Payment Methods
      ├── Shipping Zones
      └── Tax Configuration
   ```

### **Adding Products with Your Credentials**

Every API request requires your **unique authentication token** and **tenant ID**:

```javascript
// 1. Login to get token
POST /api/auth/login
{
  "email": "admin@fashionboutique.com",
  "password": "YourSecurePassword"
}

// Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tenant": "fashion-boutique-lagos",
  "user": {
    "id": "user_123",
    "email": "admin@fashionboutique.com",
    "role": "store-owner"
  }
}

// 2. Add product with your credentials
POST /api/products
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "X-Tenant-ID": "fashion-boutique-lagos"
}
Body: {
  "name": {"en": "Red Handbag"},
  "price": 15000,
  "tenant": "fashion-boutique-lagos"  // Automatically added
}
```

### **Multi-Language Content**

Add content in 17 languages to reach global customers:

```javascript
{
  "name": {
    "en": "Leather Jacket",
    "es": "Chaqueta de Cuero",
    "fr": "Veste en Cuir",
    "de": "Lederjacke",
    "ar": "سترة جلدية",
    "yo": "Jakẹti Awọ",
    "ig": "Jaket Akpụkpọ",
    "ha": "Jaket Fata",
    "sw": "Jaketi ya Ngozi",
    "am": "የቆዳ ጃኬት",
    "ko": "가죽 재킷",
    "it": "Giacca di Pelle"
  },
  "description": {
    "en": "Premium genuine leather jacket",
    "es": "Chaqueta de cuero genuino premium",
    // ... 15 more languages
  }
}
```

### **Bulk Upload Products**

Upload multiple products at once:

```javascript
POST /api/products/bulk
Headers: {
  "Authorization": "Bearer your-token",
  "X-Tenant-ID": "fashion-boutique-lagos"
}
Body: [
  { "name": {"en": "Product 1"}, "price": 10000, ... },
  { "name": {"en": "Product 2"}, "price": 15000, ... },
  { "name": {"en": "Product 3"}, "price": 20000, ... }
]
```

Or upload CSV:
```csv
name_en,name_fr,name_yo,price,currency,category,inventory
"Blue Dress","Robe Bleue","Aṣọ Bulu",25000,NGN,dresses,50
"Red Shoes","Chaussures Rouges","Bata Pupa",18000,NGN,shoes,30
```

---

## 🎨 Custom Branding

### **Logo & Visual Identity**

```javascript
// Upload logo (supports PNG, JPG, SVG)
POST /api/white-label/branding/logo
Content-Type: multipart/form-data

{
  logo: [file],           // Main logo (recommended: 200x80px)
  favicon: [file],        // Browser icon (32x32px)
  mobileLogo: [file]      // Mobile version (150x50px)
}
```

### **Color Scheme**

```javascript
PUT /api/white-label/fashion-boutique-lagos/branding
{
  "primaryColor": "#FF1493",      // Main brand color (buttons, links)
  "secondaryColor": "#000000",    // Secondary color (headers)
  "accentColor": "#FFD700",       // Accent color (highlights)
  "successColor": "#10B981",      // Success messages
  "errorColor": "#EF4444",        // Error messages
  "backgroundColor": "#FFFFFF",    // Page background
  "textColor": "#1F2937"          // Main text color
}
```

### **Typography**

```javascript
{
  "fontFamily": "Playfair Display, serif",  // Headings
  "bodyFont": "Inter, sans-serif",          // Body text
  "fontSize": {
    "small": "14px",
    "base": "16px",
    "large": "20px",
    "xlarge": "24px"
  }
}
```

### **Custom CSS (Advanced)**

```javascript
{
  "customCSS": `
    .product-card {
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #FF1493, #FF69B4);
      border: none;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .header {
      background-image: url('/patterns/luxury-pattern.png');
    }
  `
}
```

### **Custom JavaScript (Advanced)**

```javascript
{
  "customJS": `
    // Add custom analytics
    gtag('config', 'GA-FASHIONBOUTIQUE-001');
    
    // Add live chat
    window.Intercom('boot', {
      app_id: 'fashion_boutique_chat'
    });
    
    // Custom cart behavior
    document.addEventListener('cart:add', function(e) {
      console.log('Item added:', e.detail);
      // Show custom notification
    });
  `
}
```

---

## 🏗️ Technical Architecture

### **Data Isolation Strategy**

Every database query automatically filters by tenant:

```typescript
// Example: Getting products
// Without tenant isolation (WRONG):
const products = await Product.find({ category: 'shoes' });

// With tenant isolation (CORRECT - happens automatically):
const products = await Product.find({ 
  category: 'shoes',
  tenant: req.tenant  // Automatically added by middleware
});
```

### **Tenant Resolution Flow**

```
1. Request comes in: https://fashionboutique.comspace.io/products

2. Tenant Middleware extracts tenant:
   ├── Check domain: "fashionboutique.comspace.io"
   ├── Query WhiteLabel collection
   ├── Find: { domain: "fashionboutique.comspace.io" }
   └── Extract: tenantId = "fashion-boutique-lagos"

3. Attach tenant to request:
   req.tenant = "fashion-boutique-lagos"

4. All subsequent queries use this tenant:
   Product.find({ tenant: "fashion-boutique-lagos" })
   Order.find({ tenant: "fashion-boutique-lagos" })
   Customer.find({ tenant: "fashion-boutique-lagos" })

5. Response sent with tenant-specific data only
```

### **Database Schema with Tenancy**

```typescript
// Every model includes tenant field
const ProductSchema = new Schema({
  name: Object,
  price: Number,
  tenant: { 
    type: String, 
    required: true,
    index: true  // For fast queries
  }
});

// Compound indexes for performance
ProductSchema.index({ tenant: 1, category: 1 });
ProductSchema.index({ tenant: 1, createdAt: -1 });
```

### **Security Model**

```typescript
// 1. Authentication: Verify user identity
const token = jwt.verify(authToken, SECRET);
req.user = token.userId;

// 2. Authorization: Check user has access to tenant
const userTenant = await User.findById(req.user).tenant;
if (userTenant !== req.tenant) {
  throw new Error('Unauthorized: Wrong tenant');
}

// 3. Data Access: Only return tenant-specific data
const products = await Product.find({ 
  tenant: req.tenant  // User's tenant only
});
```

---

## 📡 API Reference

### **White Label Management**

#### **Create Store Configuration**
```http
POST /api/white-label
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "tenantId": "unique-store-id",
  "name": "Store Name",
  "domain": "store.comspace.io",
  "branding": {
    "logo": "https://cdn.com/logo.png",
    "primaryColor": "#FF6B6B",
    "secondaryColor": "#4ECDC4"
  },
  "contact": {
    "email": "support@store.com",
    "phone": "+234-800-000-0000"
  },
  "payment": {
    "stripeAccountId": "acct_xxxx",
    "supportedMethods": ["card", "bank_transfer"],
    "currencies": ["NGN", "USD"]
  }
}
```

#### **Get Store Configuration**
```http
GET /api/white-label
Authorization: Bearer {store-owner-token}
X-Tenant-ID: your-store-id

Response:
{
  "success": true,
  "data": {
    "config": {
      "tenantId": "your-store-id",
      "name": "Your Store",
      "branding": {...},
      "features": {...}
    }
  }
}
```

#### **Update Store Configuration**
```http
PUT /api/white-label/{tenantId}
Authorization: Bearer {store-owner-token}
Content-Type: application/json

{
  "branding": {
    "primaryColor": "#NEW_COLOR"
  },
  "features": {
    "chat": true
  }
}
```

### **Product Management**

#### **Add Product**
```http
POST /api/products
Authorization: Bearer {store-owner-token}
X-Tenant-ID: your-store-id
Content-Type: application/json

{
  "name": {
    "en": "Product Name",
    "fr": "Nom du Produit"
  },
  "description": {
    "en": "Description"
  },
  "price": 10000,
  "currency": "NGN",
  "category": "category-slug",
  "images": ["url1", "url2"],
  "inventory": 100
}
```

#### **Update Product**
```http
PUT /api/products/{productId}
Authorization: Bearer {store-owner-token}
X-Tenant-ID: your-store-id

{
  "price": 12000,
  "inventory": 80
}
```

#### **Delete Product**
```http
DELETE /api/products/{productId}
Authorization: Bearer {store-owner-token}
X-Tenant-ID: your-store-id
```

### **Order Management**

#### **Get Orders**
```http
GET /api/orders?status=pending
Authorization: Bearer {store-owner-token}
X-Tenant-ID: your-store-id
```

#### **Update Order Status**
```http
PUT /api/orders/{orderId}
Authorization: Bearer {store-owner-token}
X-Tenant-ID: your-store-id

{
  "status": "processing",
  "trackingNumber": "TRACK123"
}
```

---

## 🔐 Security & Privacy

### **Data Isolation Guarantees**

1. **Database Level**: Every query filtered by tenant
2. **API Level**: Middleware validates tenant access
3. **Authentication**: JWT tokens include tenant information
4. **Authorization**: Role-based access control per tenant

### **What Store Owners CAN Access:**
✅ Their own products, orders, customers
✅ Their own sales data and analytics
✅ Their own store configuration
✅ Their own payment information

### **What Store Owners CANNOT Access:**
❌ Other stores' data
❌ Platform-wide statistics
❌ Other store owners' information
❌ Platform configuration

---

## 💰 Pricing & Subscription

### **Subscription Tiers**

#### **Starter - $29/month**
- 100 products
- 1000 orders/month
- Basic analytics
- Email support
- Subdomain hosting

#### **Professional - $79/month**
- 1000 products
- 10,000 orders/month
- Advanced analytics
- Priority support
- Custom domain
- Multi-language support

#### **Enterprise - $199/month**
- Unlimited products
- Unlimited orders
- Full analytics suite
- 24/7 phone support
- Custom domain
- Multi-language support
- Custom integrations
- API access
- Dedicated account manager

---

## 🚀 Getting Started Checklist

- [ ] Sign up as business user
- [ ] Choose subscription plan
- [ ] Select domain (subdomain or custom)
- [ ] Upload logo and branding
- [ ] Configure colors and fonts
- [ ] Set contact information
- [ ] Connect Stripe account
- [ ] Create product categories
- [ ] Add first 5 products
- [ ] Configure shipping zones
- [ ] Set up payment methods
- [ ] Test checkout process
- [ ] Go live!

---

## 📞 Support

**For Store Owners:**
- Email: support@comspace.io
- Phone: +1-800-COMSPACE
- Live Chat: Available in admin dashboard
- Documentation: docs.comspace.io

**For Platform Issues:**
- Email: tech@comspace.io
- Emergency: +1-800-URGENT

---

## 📚 Additional Resources

- [Admin Manual](./ADMIN_MANUAL.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Global Markets Guide](./GLOBAL_MARKETS.md)
- [I18N Guide](./I18N.md)
- [Security Best Practices](./SECURITY.md)

---

**Ready to launch your own branded e-commerce store? Sign up now! 🚀**

**Version**: 2.0.0  
**Last Updated**: January 2026  
**Multi-Tenant**: ✅ Enabled  
**Languages Supported**: 17
