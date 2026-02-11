import nodemailer from 'nodemailer';
import { logger } from './logger';

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

export const initEmailService = () => {
  // Check if email is configured
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');

  if (!emailUser || !emailPass) {
    logger.warn('Email service not configured. Set EMAIL_USER and EMAIL_PASS environment variables.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  logger.info('Email service initialized');
  return transporter;
};

export const sendEmail = async (options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) => {
  if (!transporter) {
    // Try to initialize if not already done
    initEmailService();
  }

  if (!transporter) {
    logger.warn('Email service not available. Email not sent.');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"ComSpace" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    logger.info(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send email:', error);
    return { success: false, error };
  }
};

export const sendNewsletterConfirmation = async (email: string) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ComSpace!</h1>
        </div>
        <div class="content">
          <h2>Thank you for subscribing!</h2>
          <p>You've successfully subscribed to the ComSpace newsletter.</p>
          <p>You'll receive:</p>
          <ul>
            <li>Exclusive deals and promotions</li>
            <li>New product announcements</li>
            <li>Special member-only offers</li>
            <li>Tips and updates</li>
          </ul>
          <p>We're excited to have you as part of our community!</p>
          <a href="${process.env.FRONTEND_URL || 'https://comspace.app'}" class="button">Visit ComSpace</a>
        </div>
        <div class="footer">
          <p>You're receiving this email because you subscribed to ComSpace newsletter.</p>
          <p>If you didn't subscribe, you can safely ignore this email.</p>
          <p>&copy; ${new Date().getFullYear()} ComSpace. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to ComSpace!
    
    Thank you for subscribing to our newsletter!
    
    You'll receive exclusive deals, promotions, new product announcements, and special member-only offers.
    
    Visit us at: ${process.env.FRONTEND_URL || 'https://comspace.app'}
    
    © ${new Date().getFullYear()} ComSpace. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject: '✨ Welcome to ComSpace Newsletter!',
    text,
    html,
  });
};

export default { initEmailService, sendEmail, sendNewsletterConfirmation };
