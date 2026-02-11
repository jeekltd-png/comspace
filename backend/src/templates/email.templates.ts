/**
 * Branded HTML email templates for transactional emails.
 * All templates accept tenant branding (logo, colors) for white-label support.
 */

export interface EmailBranding {
  logoUrl?: string;
  primaryColor?: string;
  storeName?: string;
  storeUrl?: string;
}

const defaults: Required<EmailBranding> = {
  logoUrl: '',
  primaryColor: '#9333ea',
  storeName: 'ComSpace',
  storeUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

function merge(branding?: EmailBranding): Required<EmailBranding> {
  return { ...defaults, ...branding };
}

/** Base HTML wrapper with branding header/footer */
function baseTemplate(b: Required<EmailBranding>, title: string, body: string): string {
  const logo = b.logoUrl
    ? `<img src="${b.logoUrl}" alt="${b.storeName}" style="max-height:40px;margin-bottom:16px;" />`
    : `<h1 style="color:${b.primaryColor};font-size:24px;margin:0 0 16px;">${b.storeName}</h1>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:${b.primaryColor};padding:24px 32px;text-align:center;">
              ${logo.includes('<img') ? logo.replace(/style="[^"]*"/, 'style="max-height:40px;"') : `<span style="color:#ffffff;font-size:24px;font-weight:bold;">${b.storeName}</span>`}
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;font-size:12px;color:#71717a;">
                &copy; ${new Date().getFullYear()} ${b.storeName}. All rights reserved.
              </p>
              <p style="margin:8px 0 0;font-size:12px;">
                <a href="${b.storeUrl}" style="color:${b.primaryColor};text-decoration:none;">${b.storeUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Welcome email sent after registration */
export function welcomeEmail(
  userName: string,
  branding?: EmailBranding
): { subject: string; html: string } {
  const b = merge(branding);
  const body = `
    <h2 style="color:#18181b;margin:0 0 16px;font-size:20px;">Welcome, ${userName}! 🎉</h2>
    <p style="color:#3f3f46;line-height:1.6;margin:0 0 24px;">
      Thank you for joining <strong>${b.storeName}</strong>. We're excited to have you on board!
    </p>
    <p style="color:#3f3f46;line-height:1.6;margin:0 0 24px;">
      You can start exploring our products, customize your profile, and enjoy a seamless shopping experience.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${b.storeUrl}/products" style="display:inline-block;background:${b.primaryColor};color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
        Start Shopping
      </a>
    </div>
  `;
  return {
    subject: `Welcome to ${b.storeName}!`,
    html: baseTemplate(b, `Welcome to ${b.storeName}`, body),
  };
}

/** Order confirmation email */
export function orderConfirmationEmail(
  order: {
    orderNumber: string;
    items: Array<{ name: string; quantity: number; price: number; currency: string }>;
    subtotal: number;
    tax: number;
    shippingFee: number;
    total: number;
    currency: string;
    fulfillmentType: string;
  },
  userName: string,
  branding?: EmailBranding
): { subject: string; html: string } {
  const b = merge(branding);
  const curr = order.currency || 'USD';
  const fmt = (n: number) => new Intl.NumberFormat('en', { style: 'currency', currency: curr }).format(n);

  const itemRows = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#3f3f46;">${item.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center;color:#3f3f46;">${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;color:#3f3f46;">${fmt(item.price * item.quantity)}</td>
    </tr>`
    )
    .join('');

  const body = `
    <h2 style="color:#18181b;margin:0 0 8px;font-size:20px;">Order Confirmed ✅</h2>
    <p style="color:#71717a;margin:0 0 24px;font-size:14px;">Order #${order.orderNumber}</p>
    <p style="color:#3f3f46;line-height:1.6;margin:0 0 24px;">
      Hi ${userName}, your order has been confirmed! Here's a summary:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <thead>
        <tr style="border-bottom:2px solid #e4e4e7;">
          <th style="text-align:left;padding:8px 0;font-size:13px;color:#71717a;">Item</th>
          <th style="text-align:center;padding:8px 0;font-size:13px;color:#71717a;">Qty</th>
          <th style="text-align:right;padding:8px 0;font-size:13px;color:#71717a;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:4px 0;color:#71717a;font-size:14px;">Subtotal</td>
        <td style="padding:4px 0;text-align:right;color:#3f3f46;">${fmt(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#71717a;font-size:14px;">Tax</td>
        <td style="padding:4px 0;text-align:right;color:#3f3f46;">${fmt(order.tax)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#71717a;font-size:14px;">Shipping</td>
        <td style="padding:4px 0;text-align:right;color:#3f3f46;">${order.shippingFee === 0 ? 'Free' : fmt(order.shippingFee)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:2px solid #e4e4e7;font-weight:bold;color:#18181b;">Total</td>
        <td style="padding:8px 0;border-top:2px solid #e4e4e7;text-align:right;font-weight:bold;color:${b.primaryColor};font-size:18px;">${fmt(order.total)}</td>
      </tr>
    </table>

    <p style="color:#71717a;font-size:13px;margin:16px 0 0;">
      Fulfillment: <strong>${order.fulfillmentType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}</strong>
    </p>

    <div style="text-align:center;margin:32px 0 8px;">
      <a href="${b.storeUrl}/orders" style="display:inline-block;background:${b.primaryColor};color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
        View Order
      </a>
    </div>
  `;
  return {
    subject: `Order Confirmed — #${order.orderNumber}`,
    html: baseTemplate(b, 'Order Confirmation', body),
  };
}

/** Password reset email */
export function passwordResetEmail(
  resetUrl: string,
  userName: string,
  branding?: EmailBranding
): { subject: string; html: string } {
  const b = merge(branding);
  const body = `
    <h2 style="color:#18181b;margin:0 0 16px;font-size:20px;">Reset Your Password</h2>
    <p style="color:#3f3f46;line-height:1.6;margin:0 0 24px;">
      Hi ${userName}, we received a request to reset your password. Click the button below to create a new password:
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:${b.primaryColor};color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
        Reset Password
      </a>
    </div>
    <p style="color:#71717a;font-size:13px;line-height:1.5;margin:16px 0 0;">
      If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.
    </p>
    <p style="color:#a1a1aa;font-size:12px;margin:16px 0 0;">
      Can't click the button? Copy this link:<br/>
      <a href="${resetUrl}" style="color:${b.primaryColor};word-break:break-all;">${resetUrl}</a>
    </p>
  `;
  return {
    subject: `Password Reset — ${b.storeName}`,
    html: baseTemplate(b, 'Password Reset', body),
  };
}

/** Email verification email */
export function verifyEmailTemplate(
  verifyUrl: string,
  userName: string,
  branding?: EmailBranding
): { subject: string; html: string } {
  const b = merge(branding);
  const body = `
    <h2 style="color:#18181b;margin:0 0 16px;font-size:20px;">Verify Your Email</h2>
    <p style="color:#3f3f46;line-height:1.6;margin:0 0 24px;">
      Hi ${userName}, please verify your email address to complete your registration:
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${verifyUrl}" style="display:inline-block;background:${b.primaryColor};color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
        Verify Email
      </a>
    </div>
    <p style="color:#71717a;font-size:13px;margin:16px 0 0;">
      This link will expire in 24 hours.
    </p>
  `;
  return {
    subject: `Verify your email — ${b.storeName}`,
    html: baseTemplate(b, 'Email Verification', body),
  };
}

/** Order shipped / status update email */
export function orderStatusEmail(
  orderNumber: string,
  newStatus: string,
  trackingNumber: string | undefined,
  userName: string,
  branding?: EmailBranding
): { subject: string; html: string } {
  const b = merge(branding);
  const statusLabel = newStatus.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const trackingSection = trackingNumber
    ? `<p style="color:#3f3f46;margin:16px 0;">Tracking Number: <strong>${trackingNumber}</strong></p>`
    : '';

  const body = `
    <h2 style="color:#18181b;margin:0 0 8px;font-size:20px;">Order Update</h2>
    <p style="color:#71717a;margin:0 0 24px;font-size:14px;">Order #${orderNumber}</p>
    <p style="color:#3f3f46;line-height:1.6;">
      Hi ${userName}, your order status has been updated to:
    </p>
    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;background:${b.primaryColor}15;color:${b.primaryColor};padding:8px 24px;border-radius:999px;font-weight:600;font-size:16px;">
        ${statusLabel}
      </span>
    </div>
    ${trackingSection}
    <div style="text-align:center;margin:24px 0;">
      <a href="${b.storeUrl}/orders" style="display:inline-block;background:${b.primaryColor};color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
        View Order Details
      </a>
    </div>
  `;
  return {
    subject: `Order #${orderNumber} — ${statusLabel}`,
    html: baseTemplate(b, 'Order Status Update', body),
  };
}
