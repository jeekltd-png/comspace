# 🎯 White Label Quick Reference Card

## 📝 **Definition**

**White Label** = Create your own branded online store using ComSpace's platform

```
Your Logo + Your Colors + Your Domain = Your Store
ComSpace handles: Servers, Security, Payments, Updates
```

---

## 👥 **Who Can Create Stores?**

✅ **Anyone can sign up as a business user:**
- Retail store owners
- Entrepreneurs
- Restaurant owners
- Artists and crafters
- Service providers
- Multi-location chains

---

## 🔑 **How Credentials Work**

```
1️⃣ SIGN UP
   Email: you@yourbusiness.com
   Password: YourSecurePassword
   
2️⃣ GET TENANT ID (automatic)
   Tenant: yourbusiness-2026
   
3️⃣ LOGIN & GET TOKEN
   Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
4️⃣ USE TOKEN FOR ALL ACTIONS
   Every API call includes:
   • Authorization: Bearer {token}
   • X-Tenant-ID: yourbusiness-2026
   
5️⃣ DATA AUTO-ISOLATED
   Your content only visible to you ✅
   Other stores cannot see your data 🔒
```

---

## ✅ **What You Can Do With Your Credentials**

```
✅ Add/Edit/Delete Products
✅ Upload Images
✅ Create Categories
✅ Manage Orders
✅ View Customers
✅ Configure Branding (logo, colors)
✅ Set Prices & Inventory
✅ Export Reports
✅ Invite Staff Members
✅ Configure Shipping
✅ Set Up Payments

❌ CANNOT See Other Stores' Data
❌ CANNOT Access Platform Settings
❌ CANNOT View Other Owners' Info
```

---

## 🎨 **What "White Label" Means**

| Traditional | White Label ComSpace |
|------------|----------------------|
| Build from scratch | Use existing platform |
| Hire developers | No developers needed |
| $50k-$200k cost | $29-$199/month |
| 6-12 months setup | 1 hour setup |
| You maintain | ComSpace maintains |
| ❌ comspace.com/yourstore | ✅ yourstore.com |
| ❌ ComSpace branding | ✅ YOUR branding |

---

## 🏗️ **Multi-Tenant Architecture**

```
┌────────────────────────────────────┐
│      ComSpace Platform             │
│  (Shared Infrastructure)           │
├────────────────────────────────────┤
│                                    │
│  🏪 Store A (tenant-a)            │
│     ├─ Products: 500              │
│     ├─ Orders: 1,234              │
│     └─ Customers: 890  🔒         │
│                                    │
│  🏪 Store B (tenant-b)            │
│     ├─ Products: 300              │
│     ├─ Orders: 567                │
│     └─ Customers: 450  🔒         │
│                                    │
│  🏪 Store C (tenant-c)            │
│     ├─ Products: 800              │
│     ├─ Orders: 2,100              │
│     └─ Customers: 1,200  🔒       │
└────────────────────────────────────┘

Each store's data is 100% isolated
```

---

## 🚀 **30-Second Explanation**

**"What is White Label?"**

> ComSpace is like **Shopify** - a platform where anyone can create their own online store. You sign up with your email, customize with your logo and colors, add your products, and get your own domain like `yourstore.com`. Your customers never know ComSpace powers it - they only see YOUR brand. You control all your content with your login credentials, and your data is completely private from other store owners.

---

## 💡 **Real Examples**

### Example 1: Fashion Store
```
Before: Physical boutique only
After: fashionboutique.com
✅ 500 products online
✅ 50 orders/day
✅ Ships nationwide
✅ Owns the brand
```

### Example 2: Restaurant Chain
```
Before: No online ordering
After: 5 stores with separate sites
✅ restaurant-lagos.com
✅ restaurant-abuja.com
✅ Each manages own menu
✅ Unified brand
```

### Example 3: Handmade Crafts
```
Before: Selling at markets only
After: artisancrafts.com
✅ Global reach
✅ Card payments
✅ Professional store
✅ 500+ customers
```

---

## 📊 **Key Differences**

| | Your Store | Traditional |
|---|------------|-------------|
| **Brand** | YOUR brand ✅ | Developer's choice |
| **Domain** | yourstore.com ✅ | Shared domain |
| **Control** | Full control ✅ | Limited |
| **Data** | You own it ✅ | Platform owns |
| **Setup** | 1 hour ✅ | 6+ months |
| **Cost** | $29-$199/mo ✅ | $50k+ |

---

## 🎯 **Quick Start (3 Steps)**

```
Step 1: SIGN UP (2 min)
└─ comspace.io/register/business
   Enter: Email, Password, Business Name

Step 2: BRAND (3 min)
└─ Upload logo
   Choose colors
   Pick domain

Step 3: ADD PRODUCTS (5 min)
└─ Upload photos
   Set prices
   Write descriptions

🎉 DONE! Your store is live!
```

---

## 💰 **Pricing Snapshot**

| Plan | Price | Products | Best For |
|------|-------|----------|----------|
| Starter | $29/mo | 100 | New stores |
| Pro ⭐ | $79/mo | 1,000 | Growing |
| Enterprise | $199/mo | ∞ | Large chains |

All plans: 17 languages, SSL, support

---

## 🔐 **Data Security**

```
✅ Each store's data is isolated
✅ Bank-level encryption
✅ PCI-DSS compliant payments
✅ Daily backups
✅ You own your data
✅ Can export anytime
✅ GDPR compliant
```

---

## 📱 **Support**

```
📧 support@comspace.io
💬 Live chat in admin
📚 docs.comspace.io
🎥 Video tutorials
```

---

## � **Admin: White‑Label Management (Admin‑only)**

**Who can perform these actions:** **superadmin**, **admin**, **admin1**, **admin2**

**Admin capabilities**
- Create or update tenant white‑label config (domain, contact, features)
- Upload brand assets (logo, hero image)
- Toggle tenant features (delivery, pickup, reviews, wishlist)
- Add `customCSS` / `customJS` for tenant-specific tweaks

**Key Admin APIs (examples)**
- Fetch public branding (no auth required):
  - GET /api/white-label/config
  - Example:
    curl -H "X-Tenant-ID: fashion-lagos-2026" http://localhost:5000/api/white-label/config

- Create config (admin only):
  - POST /api/white-label/config
  - Requires: Authorization header and tenant (via subdomain or `X-Tenant-ID`)

- Update config (admin only):
  - PUT /api/white-label/config/:tenantId
  - Example:
    curl -X PUT http://localhost:5000/api/white-label/config/fashion-lagos-2026 \
      -H "Authorization: Bearer <TOKEN>" \
      -H "Content-Type: application/json" \
      -d '{"domain":"yourstore.com","contact":{"email":"support@yourstore.com"},"features":{"delivery":true}}'

- Upload asset (admin only):
  - POST /api/white-label/upload (multipart)
  - Example:
    curl -X POST http://localhost:5000/api/white-label/upload \
      -H "Authorization: Bearer <TOKEN>" \
      -F "file=@./logo.png"

**Operational notes**
- GET `/api/white-label/config` is intentionally public so storefronts (customers) can render branding safely.
- Admin routes are protected with `protect` + `authorize('superadmin','admin','admin1','admin2')`.
- Tenant selection: subdomain or `X-Tenant-ID` header (use same tenant for admin actions).
- Use the dev-only helper `POST /__debug/create-admin` or `backend/scripts/seed-admins.js` to create a test admin and get tokens for E2E.

---

## �📚 **Full Documentation**

1. [White Label Complete Guide](./WHITE_LABEL_GUIDE.md) - 50+ pages
2. [Visual Quick Start](./WHITE_LABEL_VISUAL_GUIDE.md) - With diagrams
3. [Executive Summary](./WHITE_LABEL_SUMMARY.md) - Overview
4. [Admin Manual](./ADMIN_MANUAL.md) - Store management
5. [Demo tenant: Quick seed & run](./ADMIN_ONLY/WHITE_LABEL_DEMO.md) - Seed and run a demo tenant locally

---

## ❓ **Common Questions**

**Q: Do I need technical skills?**  
A: No! Everything is point-and-click.

**Q: Can I use my own domain?**  
A: Yes! Connect yourstore.com

**Q: Is my data private?**  
A: 100% isolated from other stores.

**Q: Can I add multiple languages?**  
A: Yes! 17 languages included.

**Q: How long to setup?**  
A: About 1 hour from signup to live.

**Q: Can I cancel anytime?**  
A: Yes, no contracts.

---

**🚀 Ready? Sign up: comspace.io/register/business**

---

**Print this card for quick reference! 📄**
