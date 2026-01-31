# ComSpace Admin Guide - Complete Manual

**Admin Access Only** 🔐

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Product Management](#product-management)
4. [Order Management](#order-management)
5. [Customer Management](#customer-management)
6. [Subscription Management](#subscription-management)
7. [Multi-Language Management](#multi-language-management)
8. [Reports & Analytics](#reports--analytics)
9. [Settings & Configuration](#settings--configuration)
10. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### Admin Login

1. **Access Admin Panel**: https://yourstore.com/admin
2. **Login Credentials**:
   - Email: `admin@comspace.com`
   - Password: `Admin@123` (Change immediately after first login!)

3. **First-Time Setup Checklist**:
   - [ ] Change default password
   - [ ] Update store information
   - [ ] Configure payment gateway (Stripe)
   - [ ] Set up shipping options
   - [ ] Add product categories
   - [ ] Upload first products
   - [ ] Test checkout flow
   - [ ] Enable desired languages

---

## 📊 Dashboard Overview

### Key Metrics Displayed:

**Sales Overview:**
- Today's Revenue
- This Week's Revenue
- This Month's Revenue
- Total Revenue (All Time)

**Order Statistics:**
- Pending Orders (need attention)
- Processing Orders (being prepared)
- Shipped Orders (in transit)
- Delivered Orders (completed)
- Total Orders

**Inventory:**
- Total Products
- Low Stock Alerts (< 10 items)
- Out of Stock Products
- Active Products

**Customer Metrics:**
- Total Customers
- New Customers (This Month)
- Active Customers (Last 30 Days)
- Customer Lifetime Value

### Quick Actions:
- ➕ Add New Product
- 📦 View Pending Orders
- 👥 View Customers
- 📊 View Full Reports

---

## 🛍️ Product Management

### Adding a New Product

1. **Navigate**: Dashboard → Products → Add New Product

2. **Fill Product Information**:

   **Basic Information:**
   - Product Name (required)
   - SKU/Product Code (auto-generated or custom)
   - Category (select from dropdown)
   - Brand (optional)
   - Short Description (for listing pages)
   - Full Description (for product page)

   **Pricing:**
   - Base Price (in USD)
   - Compare-at Price (if on sale)
   - Cost per Item (for profit calculations)
   - Tax Rate (percentage)

   **Inventory:**
   - Track Inventory: Yes/No
   - Stock Quantity
   - Low Stock Threshold (alert when below this)
   - Allow Backorders: Yes/No
   - SKU/Barcode

   **Shipping:**
   - Weight (for shipping calculations)
   - Dimensions (L x W x H)
   - Ships From Location

   **Multi-Language Content:**
   - Click "Add Translation" for each language
   - Enter product name and description in:
     - English (required)
     - Spanish, French, German, etc.
     - **Yoruba, Igbo, Hausa** (for Nigerian market)

   **Product Images:**
   - Upload 1-10 images
   - First image = main product image
   - Drag to reorder
   - Recommended size: 1200x1200px
   - Formats: JPG, PNG, WebP

   **Variants** (Optional):
   - Add if product has sizes, colors, etc.
   - Each variant can have different:
     - Price
     - SKU
     - Stock quantity
     - Images

3. **SEO Optimization**:
   - Meta Title (60 characters max)
   - Meta Description (160 characters max)
   - URL Slug (auto-generated, editable)
   - Alt Text for Images

4. **Click "Save Product"** or "Save & Publish"

---

### Editing Existing Products

1. **Navigate**: Products → All Products
2. **Find Product**: Use search or filters
3. **Click Product Name** or "Edit" button
4. **Make Changes**
5. **Click "Update Product"**

### Bulk Actions

Select multiple products to:
- Change Status (Active/Inactive)
- Update Category
- Adjust Prices (percentage increase/decrease)
- Export Product Data (CSV)
- Delete Products

### Product Import/Export

**Export Products:**
- Products → Export → Select Format (CSV/Excel)
- Choose fields to include
- Download file

**Import Products:**
- Products → Import
- Download template CSV
- Fill in product data
- Upload CSV file
- Review and confirm import

---

## 📦 Order Management

### Order Workflow

**Order Statuses:**
1. **Pending** → New order received, payment confirmed
2. **Processing** → Order being prepared/packed
3. **Shipped** → Order dispatched to customer
4. **Delivered** → Customer received order
5. **Cancelled** → Order cancelled by admin or customer
6. **Refunded** → Payment returned to customer

### Processing Orders

**When New Order Arrives:**

1. **Check Order Details**:
   - Customer name and contact
   - Shipping address
   - Products ordered (name, quantity, variant)
   - Payment status (Paid/Pending)
   - Delivery method (Home Delivery/Store Pickup)

2. **Verify Inventory**:
   - Confirm all items are in stock
   - If out of stock, contact customer

3. **Update Status to "Processing"**:
   - Orders → View Order → Change Status → Processing
   - Customer receives automatic email notification

4. **Prepare Package**:
   - Print packing slip (available in order details)
   - Pick items from inventory
   - Pack securely
   - Include invoice

5. **Update Status to "Shipped"**:
   - Enter tracking number
   - Select carrier (DHL, FedEx, etc.)
   - Add shipping notes (optional)
   - Customer receives tracking email

6. **Mark as "Delivered"**:
   - After customer confirms receipt
   - Or automatically after carrier confirms delivery

### Store Pickup Orders

For orders with "Store Pickup" selected:

1. **Prepare Order**: Same as above
2. **Notify Customer**: Send "Ready for Pickup" notification
3. **Customer Arrives**: Verify identity
4. **Hand Over Order**: Mark as "Delivered"

### Handling Cancellations

**Customer Requests Cancellation:**

1. **Check Order Status**:
   - If **Pending/Processing**: Easy to cancel
   - If **Shipped**: May incur return shipping fees

2. **Cancel Order**:
   - Orders → View Order → Cancel Order
   - Select reason (customer request, out of stock, etc.)
   - Confirm cancellation

3. **Process Refund**:
   - Refund is automatic via Stripe
   - Takes 5-10 business days to customer's account
   - Customer receives refund confirmation email

### Handling Refunds

**After Delivered Order:**

1. **Customer Requests Refund**:
   - Review reason (defective, wrong item, etc.)
   - Check return policy (typically 14 days)

2. **Approve/Deny Request**:
   - If approved, provide return instructions
   - Customer ships item back

3. **Inspect Returned Item**:
   - Verify condition
   - Check if item matches order

4. **Issue Refund**:
   - Full refund or partial (if damaged by customer)
   - Deduct return shipping if applicable
   - Update inventory

5. **Customer Receives Refund**:
   - Stripe processes refund (5-10 days)
   - Email confirmation sent

---

## 👥 Customer Management

### Customer List

**View All Customers**: Customers → All Customers

**Information Displayed:**
- Name
- Email
- Phone
- Registration Date
- Total Orders
- Total Spent
- Status (Active/Inactive/Banned)

### Customer Details

Click on customer to view:

**Profile Information:**
- Personal details
- Email verification status
- Phone verification status
- Account creation date
- Last login date

**Order History:**
- All orders placed
- Total amount spent
- Average order value
- Most purchased products

**Addresses:**
- All saved shipping addresses
- Billing addresses
- Primary address

**Activity Log:**
- Recent logins
- Password changes
- Failed login attempts (security)

### Customer Actions

**Edit Customer:**
- Update contact information
- Change customer type (regular/VIP)
- Add internal notes

**Send Email:**
- Direct message to customer
- Order updates
- Special offers

**Ban/Suspend Customer:**
- If fraudulent activity detected
- Violates terms of service
- Customer can't login or place orders

**Delete Customer:**
- Removes account permanently
- Cannot be undone
- Order history retained for records

---

## 💳 Subscription Management

### Subscription Plans Overview

ComSpace offers **3 subscription tiers**:

#### 1. **Starter Plan** - $29/month (₦25,000/month)
- Up to 100 products
- 5% transaction fee
- Basic analytics
- 1 staff account
- Email support (48h response)

#### 2. **Professional Plan** - $79/month (₦70,000/month) ⭐ Most Popular
- Unlimited products
- 3% transaction fee
- Advanced analytics
- 5 staff accounts
- Priority support (24h response)
- Custom domain
- Abandoned cart recovery

#### 3. **Enterprise Plan** - $199/month (₦180,000/month)
- Everything in Professional
- 1.5% transaction fee
- Enterprise analytics
- Unlimited staff accounts
- Dedicated account manager
- 24/7 support (1h response)
- White-label mobile apps
- API access

### Managing Your Subscription

**View Current Plan:**
- Settings → Billing → Subscription

**Displays:**
- Current plan name
- Monthly/Annual billing
- Next billing date
- Payment method
- Billing history

### Upgrading Plan

1. **Settings → Billing → Upgrade**
2. **Select New Plan** (Starter → Professional → Enterprise)
3. **Review Changes**:
   - New features unlocked
   - Price difference
   - Prorated charge (immediate)
4. **Confirm Upgrade**
5. **New features available immediately**

### Downgrading Plan

1. **Settings → Billing → Change Plan**
2. **Select Lower Plan**
3. **Review Impact**:
   - Features you'll lose
   - If you exceed new limits (e.g., 100 products on Starter)
   - Must remove excess items first
4. **Effective Date**: Next billing cycle (not immediate)
5. **Confirm Downgrade**

### Cancelling Subscription

1. **Settings → Billing → Cancel Subscription**
2. **Confirm Cancellation**
3. **Store remains active until end of billing period**
4. **After that**:
   - Store is paused (not deleted)
   - Customers can't access
   - You can reactivate within 90 days
   - After 90 days, store may be deleted

### Billing & Invoices

**Payment Methods:**
- Credit/Debit Card (Visa, Mastercard, Amex)
- Bank Transfer (annual plans only)

**Update Payment Method:**
- Settings → Billing → Payment Methods
- Add new card
- Set as default
- Remove old cards

**View Invoices:**
- Settings → Billing → Invoices
- Download PDF for accounting
- All invoices emailed automatically

**Failed Payment:**
- You'll receive email notification
- 3-day grace period to update payment
- After 7 days, store is paused
- Update payment to reactivate

---

## 🌍 Multi-Language Management

### Supported Languages (13 Total)

**European:**
- English (en) - Default
- Spanish (es)
- French (fr)
- German (de)
- Portuguese (pt)
- Russian (ru)

**Middle East:**
- Arabic (ar) - with RTL layout

**Asian:**
- Chinese (zh)
- Japanese (ja)
- Hindi (hi)

**Nigerian:** 🇳🇬
- Yoruba (yo)
- Igbo (ig)
- Hausa (ha)

### Enabling Languages

1. **Settings → Languages**
2. **Select Languages** to enable
3. **Set Default Language** (typically English)
4. **Save Changes**

### Translating Content

**Product Translations:**
1. Products → Edit Product
2. Scroll to "Translations" section
3. Click "Add Translation"
4. Select language
5. Enter translated:
   - Product name
   - Description
   - SEO meta (optional)
6. Save

**Category Translations:**
- Same process for categories
- Translate category names and descriptions

**Static Content:**
- Pages (About, Contact, etc.)
- Email templates
- System messages

**Professional Translation Tips:**
- Use native speakers for accuracy
- Consider cultural context
- Test UI in each language
- Check text doesn't overflow buttons/boxes

### Nigerian Languages Best Practices

**Yoruba (yo):**
- Use proper diacritical marks (ọ, ẹ, ṣ)
- Formal vs informal tone
- Common phrases: "Ẹ káàbọ̀" (Welcome)

**Igbo (ig):**
- Standard Igbo (not dialect)
- Use modern spelling
- Common: "Nnọọ" (Welcome)

**Hausa (ha):**
- Use standard Hausa orthography
- Respect Islamic greetings
- Common: "Barka da zuwa" (Welcome)

---

## 📊 Reports & Analytics

### Sales Reports

**Access**: Dashboard → Reports → Sales

**Available Reports:**

1. **Revenue Overview**
   - Daily, Weekly, Monthly, Yearly
   - Total sales
   - Average order value
   - Number of orders
   - Visual charts

2. **Sales by Product**
   - Best-selling products
   - Revenue per product
   - Quantity sold
   - Profit margins

3. **Sales by Category**
   - Which categories perform best
   - Category-wise revenue
   - Growth trends

4. **Sales by Currency**
   - Revenue in each currency (USD, EUR, NGN, etc.)
   - Exchange rate impact
   - Regional performance

5. **Sales by Language**
   - Which language users buy most
   - Yoruba, Igbo, Hausa customer behavior
   - Language preference trends

### Customer Reports

1. **New Customers**
   - Registrations over time
   - Growth rate
   - Acquisition sources

2. **Customer Lifetime Value (CLV)**
   - Average spending per customer
   - Repeat purchase rate
   - Most valuable customers

3. **Customer Geography**
   - Countries/regions
   - Top cities
   - Shipping destinations

### Inventory Reports

1. **Stock Levels**
   - Current inventory
   - Low stock alerts
   - Out of stock items

2. **Product Performance**
   - Fast-moving items
   - Slow-moving items
   - Stock turnover rate

3. **Inventory Value**
   - Total inventory worth
   - Cost basis
   - Potential profit

### Exporting Reports

- Choose date range
- Select format (PDF, Excel, CSV)
- Click "Export"
- Download or email report

---

## ⚙️ Settings & Configuration

### Store Settings

**Settings → General**

- **Store Name**: Display name
- **Store Email**: Contact email
- **Store Phone**: Customer support number
- **Store Address**: Physical location
- **Time Zone**: For correct order timestamps
- **Default Currency**: USD, EUR, NGN, etc.
- **Default Language**: Typically English

### Payment Settings

**Settings → Payments → Stripe**

1. **Get Stripe Account**: https://stripe.com
2. **Copy API Keys**:
   - Publishable Key
   - Secret Key
3. **Enter in ComSpace**:
   - Test keys for development
   - Live keys for production
4. **Enable Payment Methods**:
   - [ ] Credit/Debit Cards
   - [ ] Apple Pay
   - [ ] Google Pay
5. **Save Settings**

**Test Mode:**
- Use test card: 4242 4242 4242 4242
- Any future expiry date
- Any CVV

**Live Mode:**
- Real transactions
- Money transferred to your Stripe account
- Payouts: Daily, Weekly, or Monthly

### Shipping Settings

**Settings → Shipping**

**Flat Rate Shipping:**
- Set one price for all orders
- Example: $5 flat rate

**Free Shipping:**
- Set minimum order amount
- Example: Free shipping over $50

**Weight-Based:**
- Calculate by total weight
- Set price per kg/lb

**Location-Based:**
- Different rates per country/region
- Example: $10 local, $25 international

**Store Pickup:**
- Enable self-pickup option
- Free for customers
- Set pickup locations

### Tax Settings

**Settings → Tax**

- **Enable Tax**: Yes/No
- **Tax Rate**: Percentage (e.g., 7.5% for Nigeria VAT)
- **Tax Included in Prices**: Yes/No
- **Tax by Region**: Different rates for different locations

### Email Settings

**Settings → Emails**

**Email Notifications Sent:**
- Order confirmation
- Order shipped
- Order delivered
- Password reset
- Welcome email

**Customize Emails:**
- Email subject lines
- Email templates
- Logo and colors
- Sender name and email

**Email Service:**
- SMTP configuration
- Or use SendGrid, Mailgun

### Staff Management

**Settings → Staff**

**Add Staff Member:**
1. Click "Add Staff"
2. Enter email
3. Assign role:
   - **Admin**: Full access
   - **Manager**: Most features, can't delete store
   - **Staff**: Products and orders only
   - **Support**: Customer service only
4. Send invitation
5. They receive email to set password

**Staff Permissions:**
- View/Edit Products
- Process Orders
- View Customers
- Access Reports
- Manage Settings
- Add Other Staff

---

## 🛠️ Troubleshooting

### Common Issues

**Problem: Orders not showing up**
- **Check**: Email notifications for order
- **Verify**: Payment was successful in Stripe
- **Look at**: Orders → All Orders (not just "Pending")

**Problem: Products not appearing on storefront**
- **Check**: Product status is "Active"
- **Verify**: Stock quantity > 0
- **Check**: Product assigned to a category
- **Check**: No visibility restrictions

**Problem: Payment failing at checkout**
- **Verify**: Stripe keys are correct (not swapped)
- **Check**: Test mode vs Live mode
- **Test**: With Stripe test cards first
- **Check**: Customer's bank not blocking

**Problem: Email notifications not sending**
- **Verify**: SMTP settings correct
- **Check**: Email service (SendGrid) is active
- **Test**: Send test email
- **Check**: Spam folder

**Problem: Images not uploading**
- **Check**: File size < 5MB
- **Verify**: Format is JPG, PNG, or WebP
- **Try**: Different browser
- **Check**: Internet connection

**Problem: Multi-language content not showing**
- **Verify**: Language is enabled in settings
- **Check**: Translation was saved
- **Clear**: Browser cache
- **Test**: In incognito/private window

### Getting Support

**Self-Service:**
- This admin manual
- User manual (docs/USER_MANUAL.md)
- FAQ section

**Email Support:**
- support@comspace.com
- Response time based on plan:
  - Starter: 48 hours
  - Professional: 24 hours
  - Enterprise: 1 hour

**Live Chat:**
- Professional & Enterprise plans only
- Available during business hours

**Phone Support:**
- Enterprise plans only
- 24/7 availability
- Dedicated account manager

---

## 📱 Mobile App Management

### White-Label Mobile Apps

**Professional & Enterprise Plans:**

Your mobile apps can be customized:
- Your store name
- Your logo and colors
- Your app icon
- No "ComSpace" branding

**Submitting to App Stores:**

**iOS (App Store):**
1. Apple Developer Account ($99/year)
2. We build your IPA file
3. Upload via App Store Connect
4. Apple review (7-14 days)
5. App goes live!

**Android (Google Play):**
1. Google Play Developer Account ($25 one-time)
2. We build your APK/AAB file
3. Upload via Google Play Console
4. Review (1-3 days)
5. App goes live!

**Enterprise Plan:**
- We handle full submission process
- App maintenance and updates
- Push notification setup

---

## 🔒 Security Best Practices

1. **Use Strong Password**
   - At least 12 characters
   - Mix uppercase, lowercase, numbers, symbols
   - Don't reuse passwords

2. **Enable Two-Factor Authentication (2FA)**
   - Coming soon
   - Adds extra security layer

3. **Limit Staff Access**
   - Give minimum necessary permissions
   - Remove staff who leave

4. **Regular Backups**
   - Database backed up daily (automatic)
   - Download exports monthly

5. **Monitor for Fraud**
   - Unusual order patterns
   - Multiple failed payments
   - Suspicious customer behavior

6. **Keep Software Updated**
   - Platform updates applied automatically
   - Check for security announcements

7. **Review Access Logs**
   - Check who's logging in
   - Verify no unauthorized access

---

## 📈 Tips for Success

### Growing Your Store

1. **Add Products Regularly**
   - Keep inventory fresh
   - Seasonal items

2. **Use High-Quality Images**
   - Professional photos
   - Multiple angles
   - Show scale

3. **Write Detailed Descriptions**
   - Benefits, not just features
   - Answer common questions
   - Use keywords for SEO

4. **Leverage Multi-Language**
   - Translate top-selling products first
   - Focus on your target markets
   - Nigerian market: Yoruba, Igbo, Hausa

5. **Offer Promotions**
   - Discount codes
   - Free shipping thresholds
   - Bundle deals

6. **Monitor Analytics**
   - Check daily sales
   - Identify trends
   - Adjust strategy

7. **Provide Excellent Support**
   - Respond quickly
   - Be helpful
   - Follow up

8. **Collect Customer Reviews**
   - Email after delivery
   - Incentivize reviews
   - Display prominently

### Marketing Your Store

- Social media (Instagram, Facebook)
- Email campaigns
- Google Ads
- SEO optimization
- Influencer partnerships
- Local events (for Nigerian market)

---

## 🇳🇬 Nigerian Market Optimization

### Targeting Nigerian Customers

**Language Strategy:**
- Enable Yoruba, Igbo, Hausa
- Translate product names and descriptions
- Use culturally relevant messaging

**Currency:**
- Display prices in NGN (₦)
- Auto-detect Nigerian users
- Clear pricing (no hidden fees)

**Payment Integration:**
- Stripe (international)
- Paystack (Nigerian gateway) - coming soon
- Flutterwave (Pan-African) - coming soon
- Bank transfer option

**Shipping:**
- Partner with local couriers
- Clear delivery timelines
- Multiple pickup locations
- Cash on delivery (coming soon)

**Customer Trust:**
- Display security badges
- Customer testimonials in local languages
- Local phone support
- NDPR compliance (Nigerian data protection)

---

## 📞 Quick Reference

### Important Links

- **Admin Dashboard**: https://yourstore.com/admin
- **Storefront**: https://yourstore.com
- **Support**: support@comspace.com
- **Documentation**: https://docs.comspace.com

### Keyboard Shortcuts

- `Ctrl + K`: Quick search
- `Ctrl + N`: New product
- `Ctrl + O`: View orders
- `Ctrl + /`: Help menu

### Support Contacts

- **Email**: support@comspace.com
- **Phone** (Enterprise): +234 XXX XXX XXXX
- **Live Chat**: Available in dashboard

---

**Document Version**: 1.0.0  
**Last Updated**: January 18, 2026  
**For**: Admin Users Only 🔐  
**Languages Supported**: 13 (including Yoruba, Igbo, Hausa) 🇳🇬

---

**🎉 You're ready to manage your ComSpace store like a pro!**
