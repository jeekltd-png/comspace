import nodemailer from 'nodemailer';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

const createTransporter = () => {
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Reuse transporter across sends (avoid creating a new TCP connection per email)
let _transporter: nodemailer.Transporter | null = null;
const getTransporter = () => {
  if (!_transporter) _transporter = createTransporter();
  return _transporter;
};

// Cap test emails to prevent unbounded memory growth
const MAX_TEST_EMAILS = 500;
export const testSentEmails: Array<{ to: string; subject: string; text: string; html?: string; timestamp: string }> = [];

export const getSentEmails = () => testSentEmails;
export const clearSentEmails = () => { testSentEmails.length = 0; };

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const transporter = getTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@comspace.com',
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html || options.text,
  };

  // Record emails in-memory for debug/test environments
  try {
    if (process.env.DEBUG_EMAIL === 'true' || process.env.NODE_ENV === 'test') {
      if (testSentEmails.length >= MAX_TEST_EMAILS) testSentEmails.splice(0, testSentEmails.length - Math.floor(MAX_TEST_EMAILS / 2));
      testSentEmails.push({
        to: mailOptions.to as string,
        subject: mailOptions.subject as string,
        text: mailOptions.text as string,
        html: mailOptions.html as string,
        timestamp: new Date().toISOString(),
      });
    }

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}`);
  } catch (err) {
    const error = err as any;
    logger.error('Email sending failed:', error);
    // still record the failed attempt for debugging
    if (process.env.DEBUG_EMAIL === 'true' || process.env.NODE_ENV === 'test') {
      testSentEmails.push({
        to: mailOptions.to as string,
        subject: `[FAILED] ${mailOptions.subject}` as string,
        text: `${mailOptions.text}\n\n[ERROR] ${error?.message || String(error)}`,
        html: mailOptions.html as string,
        timestamp: new Date().toISOString(),
      });
    }
    throw error;
  }
};
