# ComSpace Admin Guide

## Table of Contents
1. [Admin Dashboard Overview](#admin-dashboard-overview)
2. [User Management](#user-management)
3. [Product Management](#product-management)
4. [Order Management](#order-management)
5. [Inventory Management](#inventory-management)
6. [Reports and Analytics](#reports-and-analytics)
7. [White Label Configuration](#white-label-configuration)
8. [Store Locations](#store-locations)
9. [Settings](#settings)

---

## Admin Dashboard Overview

### Accessing Admin Panel
1. Login with admin credentials
2. Navigate to `/admin` or click "Admin Panel" in user menu
3. Role-based access: Only users with `admin` or `merchant` role can access

### Dashboard Metrics
- **Total Users**: Registered customer count
- **Total Orders**: All-time order count
- **Total Revenue**: Sum of completed orders
- **Active Products**: Number of active products
- **Pending Orders**: Orders awaiting processing
- **Low Stock Alerts**: Products below threshold

### Recent Activity
- Latest orders
- New user registrations
- Product updates
- System notifications

---

## User Management

### Viewing Users
1. Navigate to **Admin** → **Users**
2. View user list with:
   - Name, Email, Role
   - Registration date
   - Last login
   - Status (active/inactive)

### User Actions
- **View Details**: Click on user to see full profile
- **Edit User**: Modify user information
- **Change Role**: Promote to merchant/admin
- **Deactivate**: Suspend user account
- **Delete**: Permanently remove user (requires confirmation)

### Filtering Users
- Search by name or email
- Filter by role (customer, merchant, admin)
- Filter by status (active/inactive)
- Sort by registration date, last login

### Exporting User Data
1. Click **"Export Users"**
2. Select format (CSV, Excel)
3. Choose date range
4. Download file

---

## Product Management

### Creating Products
1. Navigate to **Admin** → **Products** → **Add New**
2. Fill in product details:
   - **Name**: Product title
   - **SKU**: Unique identifier
   - **Description**: Full description (supports rich text)
   - **Short Description**: Brief summary
   - **Category**: Select from dropdown
   - **Base Price**: Price in base currency (USD)
   - **Stock**: Quantity available
   - **Images**: Upload multiple images (drag & drop)
   - **Tags**: Add searchable tags
   - **Variants**: Size, color options
   - **SEO**: Meta title, description, keywords

3. Configure pricing:
   - Set base price
   - System auto-converts to all currencies
   - Set sale price (optional)
   - Schedule sale dates

4. Inventory settings:
   - Stock quantity
   - Low stock threshold
   - Unlimited stock option
   - Track inventory

5. Click **"Publish"** or **"Save Draft"**

### Editing Products
1. Go to product list
2. Click **"Edit"** on product row
3. Modify any fields
4. Click **"Update Product"**

### Bulk Operations
1. Select multiple products (checkboxes)
2. Choose action from dropdown:
   - Activate/Deactivate
   - Delete
   - Update category
   - Apply discount
3. Confirm action

### Product Images
- **Primary Image**: First image shown in listings
- **Gallery**: Additional images (up to 10)
- **Optimization**: Auto-resized for web/mobile
- **Alt Text**: For SEO and accessibility

### Product Variants
1. Click **"Add Variant"** in product editor
2. Name variant type (e.g., "Size", "Color")
3. Add options (e.g., "S, M, L, XL")
4. Set price modifiers (+/- amount)
5. Save variant

### Featured Products
- Toggle "Featured" checkbox
- Featured products appear on homepage
- Limit: 8-12 featured products recommended

---

## Order Management

### Viewing Orders
1. Navigate to **Admin** → **Orders**
2. View order list with:
   - Order number
   - Customer name
   - Total amount
   - Status
   - Date

### Order Details
Click on order to view:
- Customer information
- Items ordered
- Shipping/pickup details
- Payment information
- Status history
- Notes

### Updating Order Status
1. Open order details
2. Select new status from dropdown:
   - Pending → Confirmed
   - Confirmed → Processing
   - Processing → Shipped/Ready for Pickup
   - Shipped → Out for Delivery → Delivered
3. Add note (optional)
4. Click **"Update Status"**
5. Customer receives notification automatically

### Order Statuses
- **Pending**: Awaiting payment confirmation
- **Confirmed**: Payment received, order accepted
- **Processing**: Being prepared for shipment/pickup
- **Shipped**: Package dispatched (delivery orders)
- **Out for Delivery**: In transit to customer
- **Delivered**: Successfully delivered
- **Ready for Pickup**: Available at store
- **Picked Up**: Customer collected order
- **Cancelled**: Order cancelled
- **Refunded**: Payment refunded

### Adding Tracking Information
1. Open order details
2. Enter tracking number
3. Select carrier
4. Click **"Add Tracking"**
5. Customer receives tracking link via email

### Processing Refunds
1. Open order details
2. Click **"Refund"** button
3. Select refund amount (full or partial)
4. Enter reason
5. Confirm refund
6. Refund processed through payment gateway
7. Customer notified

### Order Filters
- Status filter
- Date range
- Payment method
- Fulfillment type (delivery/pickup)
- Customer name/email search

### Exporting Orders
1. Apply desired filters
2. Click **"Export Orders"**
3. Select format (CSV, Excel, PDF)
4. Download report

---

## Inventory Management

### Stock Overview
1. Navigate to **Admin** → **Inventory**
2. View all products with stock levels
3. Sort by stock quantity
4. Identify low stock items (highlighted)

### Updating Stock
**Individual Update**:
1. Click on product
2. Enter new stock quantity
3. Save changes

**Bulk Update**:
1. Upload CSV file with SKU and quantities
2. System validates and updates
3. View import summary

### Low Stock Alerts
- Automatic alerts when stock falls below threshold
- Email notifications to admin
- Dashboard widget shows low stock items
- Set custom thresholds per product

### Stock History
- View stock change logs
- See who made changes and when
- Track sold quantities
- Identify trends

### Inventory Report
1. Navigate to **Reports** → **Inventory**
2. View:
   - Current stock levels
   - Stock value
   - Out of stock items
   - Low stock items
   - Fast-moving products
   - Slow-moving products

---

## Reports and Analytics

### Sales Reports
1. Navigate to **Admin** → **Reports** → **Sales**
2. Select date range
3. View metrics:
   - Total sales
   - Number of orders
   - Average order value
   - Sales by day/week/month
   - Top-selling products
   - Sales by category
   - Revenue by currency

4. Export report (PDF, Excel)

### Customer Analytics
- New vs returning customers
- Customer lifetime value
- Geographic distribution
- Purchase frequency
- Customer segments

### Product Performance
- Best-selling products
- Revenue by product
- Conversion rates
- Product views vs purchases
- Cart abandonment rate

### Financial Reports
- Daily/weekly/monthly revenue
- Payment method breakdown
- Tax collected
- Shipping revenue
- Refunds and cancellations

### Traffic Analytics
- Page views
- Unique visitors
- Traffic sources
- Device breakdown (web/mobile)
- Bounce rate
- Session duration

### Custom Reports
1. Click **"Create Custom Report"**
2. Select metrics
3. Choose date range
4. Apply filters
5. Generate report
6. Save for future use

---

## White Label Configuration

### Understanding White Label
White labeling allows you to customize the platform for different clients or brands, each with their own branding, domain, and configuration.

### Creating New Tenant
1. Navigate to **Admin** → **White Label** → **Add Tenant**
2. Enter tenant information:
   - **Tenant ID**: Unique identifier (e.g., `client-name`)
   - **Name**: Display name
   - **Domain**: Custom domain (e.g., `client.com`)

3. Configure branding:
   - **Logo**: Upload logo image (PNG, SVG)
   - **Favicon**: Upload favicon
   - **Primary Color**: Brand color (#hex)
   - **Secondary Color**: Accent color
   - **Font Family**: Select or custom

4. Enable/disable features:
   - ✅ Delivery
   - ✅ Store Pickup
   - ✅ Product Reviews
   - ✅ Wishlist
   - ✅ Live Chat
   - ✅ Social Login (Google, Apple)

5. Payment configuration:
   - Stripe account ID (separate per tenant)
   - Supported payment methods
   - Enabled currencies

6. Contact information:
   - Support email
   - Phone number
   - Business address

7. Social media links (optional)

8. SEO settings:
   - Meta title
   - Meta description
   - Keywords

9. Advanced customization:
   - Custom CSS
   - Custom JavaScript
   - Custom email templates

10. Click **"Create Tenant"**

### Managing Tenants
- **View All**: List of all tenants
- **Edit**: Modify tenant configuration
- **Activate/Deactivate**: Enable or disable tenant
- **Delete**: Remove tenant (requires confirmation)

### Domain Configuration
1. Point custom domain to platform
2. Add DNS records:
   ```
   Type: CNAME
   Name: @
   Value: comspace.platform.com
   ```
3. SSL certificate auto-generated
4. Test domain access

### Testing White Label
1. Open incognito/private browser
2. Navigate to tenant domain
3. Verify branding appears correctly
4. Test all features
5. Check mobile responsiveness

---

## Store Locations

### Adding Store Location
1. Navigate to **Admin** → **Stores** → **Add Store**
2. Fill in details:
   - **Store Name**
   - **Store Code**: Unique ID
   - **Address**: Full address
   - **Coordinates**: Auto-filled from address
   - **Phone & Email**

3. Set operating hours:
   - Select days
   - Set open/close times
   - Mark closed days

4. Configure inventory:
   - Link products available at this store
   - Set quantities per product

5. Upload store photo (optional)
6. Click **"Add Store"**

### Managing Stores
- Edit store information
- Update inventory
- Deactivate temporarily
- View pickup orders per store

---

## Settings

### General Settings
- Site name
- Default currency
- Default language
- Time zone
- Date format

### Email Settings
- SMTP configuration
- Email templates
- Notification preferences
- Test email delivery

### Payment Settings
- Stripe configuration
- Webhook endpoints
- Supported currencies
- Payment methods

### Shipping Settings
- Shipping zones
- Rates by location
- Free shipping threshold
- Delivery time estimates

### Tax Settings
- Tax rates by region
- Tax-inclusive pricing
- Tax exemptions

### Security Settings
- Two-factor authentication
- Session timeout
- IP whitelist
- Rate limiting

### Backup & Maintenance
- Database backups
- Scheduled maintenance
- System logs
- Cache management

---

## Best Practices

### Product Management
- Use high-quality images
- Write detailed descriptions
- Keep stock updated
- Use relevant tags
- Regular price reviews

### Order Processing
- Process orders quickly
- Communicate with customers
- Update tracking promptly
- Handle returns professionally

### Analytics
- Review reports weekly
- Identify trends
- Act on insights
- Monitor KPIs

### Security
- Use strong passwords
- Enable 2FA
- Regular audits
- Monitor suspicious activity

---

## Support

For admin support:
- **Email**: admin-support@comspace.com
- **Documentation**: [comspace.com/docs](https://comspace.com/docs)
- **Training Videos**: [comspace.com/training](https://comspace.com/training)

**Version**: 1.0.0  
**Last Updated**: January 2026
