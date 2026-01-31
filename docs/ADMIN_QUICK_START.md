# Admin Quick Start Guide

**⚡ Fast Setup for New Admins**

---

## 🔐 Step 1: Login

1. Go to: **https://yourstore.com/admin**
2. Login:
   - Email: `admin@comspace.com`
   - Password: `Admin@123`
3. **Immediately change password**: Settings → Account → Change Password

---

## ⚙️ Step 2: Store Setup (15 minutes)

### A. Store Information
**Settings → General**

- Store Name: Your Store Name
- Email: support@yourstore.com
- Phone: Your phone number
- Address: Your business address
- Currency: NGN (₦) for Nigeria or USD ($)
- Language: English (default)

**Save Changes**

---

### B. Payment Setup (Stripe)
**Settings → Payments**

1. Create Stripe account: https://stripe.com
2. Copy your API keys (Dashboard → Developers → API Keys):
   - **Test Mode** (for testing):
     - Publishable key: `pk_test_...`
     - Secret key: `sk_test_...`
   - **Live Mode** (for real payments):
     - Publishable key: `pk_live_...`
     - Secret key: `sk_live_...`
3. Paste in ComSpace
4. **Enable**: Cards, Apple Pay, Google Pay
5. **Save**

**Test Payment:**
- Use card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVV: Any 3 digits

---

### C. Enable Nigerian Languages 🇳🇬
**Settings → Languages**

- [x] English (default)
- [x] Yoruba
- [x] Igbo
- [x] Hausa

**Save Changes**

---

### D. Shipping Setup
**Settings → Shipping**

**Option 1 - Flat Rate:**
- Name: "Standard Shipping"
- Rate: ₦2,000 or $10
- Delivery: 3-5 business days

**Option 2 - Free Shipping:**
- Enable free shipping
- Minimum order: ₦10,000 or $50

**Option 3 - Store Pickup:**
- Enable store pickup
- Add pickup location(s)

**Save**

---

## 📦 Step 3: Add Your First Products

### Quick Method:

1. **Dashboard → Products → Add New**

2. **Fill in:**
   - **Name**: Cotton T-Shirt
   - **Price**: ₦5,000 or $20
   - **Description**: Comfortable cotton t-shirt
   - **Category**: Create "Clothing"
   - **Stock**: 50
   - **Upload Image**: (Drag & drop)

3. **Add Translations**:
   - Click "Add Translation"
   - **Yoruba**: "Seeti Owu"
   - **Igbo**: "Uwe Owu"
   - **Hausa**: "Rigar Auduga"

4. **Save & Publish**

**Repeat for 5-10 products** to start.

---

## ✅ Step 4: Test Your Store

### As Admin:
1. Go to: **https://yourstore.com**
2. Switch language to **Yoruba** → Check translations
3. Switch to **Igbo** → Verify
4. Switch to **Hausa** → Verify
5. Switch currency to **NGN (₦)** → Check prices

### As Customer:
1. Open **incognito/private window**
2. Go to your store
3. Add product to cart
4. Go to checkout
5. Fill shipping info
6. Use test card: `4242 4242 4242 4242`
7. Complete order

### Check Order:
1. Back in admin panel
2. **Orders → All Orders**
3. You should see test order!
4. Update status: **Processing** → **Shipped** → **Delivered**

---

## 📊 Step 5: Monitor Dashboard

**What to Check Daily:**

- [ ] **New Orders** → Process them
- [ ] **Low Stock Alerts** → Restock
- [ ] **Customer Messages** → Reply
- [ ] **Revenue Stats** → Track growth

---

## 🔥 Pro Tips

### 1. Product Images
- Use high-quality photos (1200x1200px)
- Multiple angles
- White or clean background
- Show product in use

### 2. Descriptions
- Write in English first
- Translate to Yoruba, Igbo, Hausa
- Include benefits, not just features
- Add size charts if applicable

### 3. Pricing
- Research competitors
- Factor in costs:
  - Product cost
  - Shipping
  - Platform fees (3-5%)
  - Stripe fees (2.9% + ₦50)
  - Profit margin (30-50%)

### 4. Customer Service
- Reply to messages within 24 hours
- Be polite and helpful
- Track orders proactively
- Handle complaints professionally

---

## 🇳🇬 Nigerian Market Tips

### Language Usage
- **Yoruba**: Western Nigeria (Lagos, Ibadan, Abeokuta)
- **Igbo**: Eastern Nigeria (Enugu, Onitsha, Aba)
- **Hausa**: Northern Nigeria (Kano, Kaduna, Zaria)

**Strategy:**
- Translate all products
- Use local idioms/phrases
- Show prices in Naira (₦)
- Offer local payment methods

### Marketing
- Facebook/Instagram ads targeting Nigeria
- WhatsApp Business for customer service
- Partner with Nigerian influencers
- Offer bundle deals popular in Nigeria

---

## 🚨 Common Issues & Fixes

### "Payment not working"
- Check Stripe keys are correct
- Verify live mode (not test mode)
- Ensure card details correct

### "Products not showing"
- Check status is "Active"
- Verify stock > 0
- Refresh page/clear cache

### "Email not sending"
- Check email settings
- Verify SMTP config
- Check spam folder

### "Translation not displaying"
- Save translation first
- Enable language in settings
- Clear browser cache

---

## 📚 Need More Help?

**Full Admin Manual**: [ADMIN_MANUAL.md](./ADMIN_MANUAL.md)

**Topics Covered:**
- Detailed product management
- Order processing workflows
- Customer management
- Subscription plans & billing
- Multi-language management
- Reports & analytics
- Security best practices
- Troubleshooting guide

**Support:**
- Email: support@comspace.com
- Response time: 24-48 hours (based on plan)

---

## 🎯 30-Day Success Plan

### Week 1: Setup
- [ ] Complete store setup
- [ ] Add 10-20 products
- [ ] Test checkout flow
- [ ] Set up shipping

### Week 2: Content
- [ ] Add product descriptions
- [ ] Translate to Nigerian languages
- [ ] Upload quality images
- [ ] Set up email templates

### Week 3: Marketing
- [ ] Create social media accounts
- [ ] Run first ad campaign
- [ ] Reach out to influencers
- [ ] Email friends/family

### Week 4: Optimize
- [ ] Check analytics
- [ ] Adjust pricing
- [ ] Add best-sellers
- [ ] Improve descriptions

---

## ✅ Launch Checklist

Before going live:

- [ ] Store information complete
- [ ] Payment gateway in live mode
- [ ] At least 20 products added
- [ ] Products translated (Yoruba, Igbo, Hausa)
- [ ] Shipping rates configured
- [ ] Test order completed successfully
- [ ] Email notifications working
- [ ] Privacy policy added
- [ ] Terms & conditions added
- [ ] About page completed
- [ ] Contact information visible
- [ ] Social media linked
- [ ] Mobile-friendly tested

---

**🎉 You're ready to launch your Nigerian e-commerce store!**

**Version**: 1.0.0  
**For**: New Admin Users  
**Setup Time**: ~15 minutes  
**Languages**: English, Yoruba, Igbo, Hausa 🇳🇬
