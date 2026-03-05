/**
 * Invoice & Receipt Generation Service
 * 
 * Generates PDF invoices/receipts with embedded QR codes containing unique
 * verification URLs. Each invoice gets a cryptographically secure verification
 * token that can be scanned to verify authenticity.
 */

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { logger } from './logger';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'invoices');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface InvoiceData {
  invoiceNumber: string;
  verificationToken: string;
  type: 'invoice' | 'receipt';
  issuedAt: Date;
  dueDate?: Date;
  from: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    registrationNumber?: string;
    taxId?: string;
    logo?: string;
  };
  to: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    sku?: string;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingFee: number;
  discount: number;
  total: number;
  currency: string;
  paymentMethod?: string;
  paymentIntentId?: string;
  paidAt?: Date;
  orderNumber?: string;
  notes?: string;
  branding?: {
    primaryColor?: string;
    storeName?: string;
  };
}

/**
 * Generate a QR code data URL containing a verification link.
 * The QR encodes: FRONTEND_URL/verify/invoice/VERIFICATION_TOKEN
 */
export async function generateQRCode(verificationToken: string): Promise<string> {
  const verificationUrl = `${FRONTEND_URL}/verify/invoice/${verificationToken}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H', // High error correction for reliability
      margin: 2,
      width: 150,
      color: {
        dark: '#18181b',
        light: '#ffffff',
      },
    });
    return qrDataUrl;
  } catch (error) {
    logger.error('QR code generation failed:', error);
    throw error;
  }
}

/**
 * Generate a QR code as a PNG buffer (for embedding in PDFs)
 */
export async function generateQRCodeBuffer(verificationToken: string): Promise<Buffer> {
  const verificationUrl = `${FRONTEND_URL}/verify/invoice/${verificationToken}`;
  try {
    const buffer = await QRCode.toBuffer(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 150,
      color: {
        dark: '#18181b',
        light: '#ffffff',
      },
    });
    return buffer;
  } catch (error) {
    logger.error('QR code buffer generation failed:', error);
    throw error;
  }
}

/**
 * Format currency amount
 */
function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Generate a PDF invoice/receipt and save to disk.
 * Returns the file path and filename.
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<{
  filePath: string;
  fileName: string;
  buffer: Buffer;
}> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `${data.type === 'receipt' ? 'Receipt' : 'Invoice'} - ${data.invoiceNumber}`,
          Author: data.from.name,
          Subject: `${data.type === 'receipt' ? 'Receipt' : 'Invoice'} for order ${data.orderNumber || ''}`,
        },
      });

      const fileName = `${data.invoiceNumber.replace(/\//g, '-')}.pdf`;
      const filePath = path.join(UPLOAD_DIR, fileName);
      const writeStream = fs.createWriteStream(filePath);
      const bufferChunks: Buffer[] = [];

      doc.pipe(writeStream);
      doc.on('data', (chunk: Buffer) => bufferChunks.push(chunk));

      const primaryColor = data.branding?.primaryColor || '#9333ea';

      // ── Header ──
      doc
        .rect(0, 0, doc.page.width, 100)
        .fill(primaryColor);

      doc
        .fontSize(28)
        .fillColor('#ffffff')
        .text(data.branding?.storeName || data.from.name, 50, 35, { align: 'left' });

      const typeLabel = data.type === 'receipt' ? 'RECEIPT' : 'INVOICE';
      doc
        .fontSize(14)
        .fillColor('#ffffff')
        .text(typeLabel, 400, 35, { align: 'right', width: 150 });

      doc
        .fontSize(10)
        .fillColor('#ffffffcc')
        .text(`#${data.invoiceNumber}`, 400, 55, { align: 'right', width: 150 });

      // ── Invoice Details Section ──
      doc.fillColor('#18181b');
      const detailsY = 120;

      // From (left column)
      doc.fontSize(10).fillColor('#71717a').text('FROM', 50, detailsY);
      doc.fontSize(11).fillColor('#18181b').text(data.from.name, 50, detailsY + 15);
      doc.fontSize(9).fillColor('#3f3f46').text(data.from.email, 50, detailsY + 30);
      if (data.from.phone) doc.text(data.from.phone, 50, detailsY + 42);
      if (data.from.address) doc.text(data.from.address, 50, detailsY + 54, { width: 200 });
      if (data.from.registrationNumber) {
        doc.fontSize(8).fillColor('#71717a').text(`Reg: ${data.from.registrationNumber}`, 50, detailsY + 78);
      }
      if (data.from.taxId) {
        doc.text(`Tax ID: ${data.from.taxId}`, 50, detailsY + 90);
      }

      // To (right column)
      doc.fontSize(10).fillColor('#71717a').text('BILL TO', 350, detailsY);
      doc.fontSize(11).fillColor('#18181b').text(data.to.name, 350, detailsY + 15);
      doc.fontSize(9).fillColor('#3f3f46').text(data.to.email, 350, detailsY + 30);
      if (data.to.phone) doc.text(data.to.phone, 350, detailsY + 42);
      if (data.to.address) doc.text(data.to.address, 350, detailsY + 54, { width: 200 });

      // Dates
      const dateY = detailsY + 110;
      doc.fontSize(9).fillColor('#71717a');
      doc.text('Issue Date:', 50, dateY);
      doc.fillColor('#18181b').text(new Date(data.issuedAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      }), 120, dateY);

      if (data.dueDate) {
        doc.fillColor('#71717a').text('Due Date:', 250, dateY);
        doc.fillColor('#18181b').text(new Date(data.dueDate).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'long', year: 'numeric',
        }), 320, dateY);
      }

      if (data.orderNumber) {
        doc.fillColor('#71717a').text('Order:', 420, dateY);
        doc.fillColor('#18181b').text(data.orderNumber, 460, dateY);
      }

      // ── Items Table ──
      const tableTop = dateY + 30;
      
      // Table header
      doc
        .rect(50, tableTop, doc.page.width - 100, 22)
        .fill('#f4f4f5');

      doc.fontSize(9).fillColor('#71717a');
      doc.text('DESCRIPTION', 55, tableTop + 6);
      doc.text('SKU', 270, tableTop + 6, { width: 60, align: 'center' });
      doc.text('QTY', 340, tableTop + 6, { width: 40, align: 'center' });
      doc.text('UNIT PRICE', 385, tableTop + 6, { width: 70, align: 'right' });
      doc.text('TOTAL', 465, tableTop + 6, { width: 80, align: 'right' });

      // Table rows
      let rowY = tableTop + 28;
      doc.fontSize(9).fillColor('#18181b');

      for (const item of data.items) {
        if (rowY > 680) {
          doc.addPage();
          rowY = 50;
        }

        doc.fillColor('#3f3f46').text(item.description, 55, rowY, { width: 210 });
        doc.text(item.sku || '—', 270, rowY, { width: 60, align: 'center' });
        doc.text(String(item.quantity), 340, rowY, { width: 40, align: 'center' });
        doc.text(formatCurrency(item.unitPrice, data.currency), 385, rowY, { width: 70, align: 'right' });
        doc.fillColor('#18181b').text(formatCurrency(item.total, data.currency), 465, rowY, { width: 80, align: 'right' });

        rowY += 20;

        // Row separator
        doc
          .moveTo(55, rowY - 4)
          .lineTo(doc.page.width - 50, rowY - 4)
          .strokeColor('#e4e4e7')
          .lineWidth(0.5)
          .stroke();
      }

      // ── Totals Section ──
      const totalsX = 380;
      const totalsValueX = 465;
      const totalsWidth = 80;
      let totalsY = rowY + 15;

      doc.fontSize(9);

      // Subtotal  
      doc.fillColor('#71717a').text('Subtotal', totalsX, totalsY);
      doc.fillColor('#18181b').text(formatCurrency(data.subtotal, data.currency), totalsValueX, totalsY, { width: totalsWidth, align: 'right' });
      totalsY += 18;

      // Tax
      if (data.taxAmount > 0) {
        doc.fillColor('#71717a').text(`Tax (${(data.taxRate * 100).toFixed(0)}%)`, totalsX, totalsY);
        doc.fillColor('#18181b').text(formatCurrency(data.taxAmount, data.currency), totalsValueX, totalsY, { width: totalsWidth, align: 'right' });
        totalsY += 18;
      }

      // Shipping
      doc.fillColor('#71717a').text('Shipping', totalsX, totalsY);
      doc.fillColor('#18181b').text(
        data.shippingFee === 0 ? 'Free' : formatCurrency(data.shippingFee, data.currency),
        totalsValueX, totalsY, { width: totalsWidth, align: 'right' }
      );
      totalsY += 18;

      // Discount
      if (data.discount > 0) {
        doc.fillColor('#71717a').text('Discount', totalsX, totalsY);
        doc.fillColor('#dc2626').text(`-${formatCurrency(data.discount, data.currency)}`, totalsValueX, totalsY, { width: totalsWidth, align: 'right' });
        totalsY += 18;
      }

      // Total
      totalsY += 5;
      doc
        .moveTo(totalsX, totalsY)
        .lineTo(totalsValueX + totalsWidth, totalsY)
        .strokeColor(primaryColor)
        .lineWidth(2)
        .stroke();
      totalsY += 8;

      doc.fontSize(14).fillColor(primaryColor).text('TOTAL', totalsX, totalsY);
      doc.text(formatCurrency(data.total, data.currency), totalsValueX, totalsY, { width: totalsWidth, align: 'right' });

      // Payment status
      if (data.paidAt) {
        totalsY += 25;
        doc.fontSize(10).fillColor('#16a34a').text(
          `✓ PAID — ${new Date(data.paidAt).toLocaleDateString('en-GB')}`,
          totalsX, totalsY
        );
        if (data.paymentMethod) {
          doc.fontSize(8).fillColor('#71717a').text(`via ${data.paymentMethod}`, totalsX, totalsY + 14);
        }
      }

      // ── QR Code ──
      try {
        const qrBuffer = await generateQRCodeBuffer(data.verificationToken);
        const qrY = Math.max(totalsY + 40, rowY + 15);

        if (qrY < 700) {
          doc.image(qrBuffer, 55, qrY, { width: 100, height: 100 });
          doc.fontSize(7).fillColor('#71717a');
          doc.text('Scan to verify authenticity', 55, qrY + 105, { width: 100, align: 'center' });
          doc.text(`${FRONTEND_URL}/verify/invoice/${data.verificationToken.substring(0, 12)}...`, 55, qrY + 115, {
            width: 150,
            align: 'left',
          });
        }
      } catch (qrError) {
        logger.warn('Could not embed QR code in PDF:', qrError);
      }

      // ── Notes ──
      if (data.notes) {
        const notesY = Math.min(doc.y + 20, 720);
        doc.fontSize(9).fillColor('#71717a').text('Notes:', 55, notesY);
        doc.fontSize(9).fillColor('#3f3f46').text(data.notes, 55, notesY + 12, { width: 300 });
      }

      // ── Footer ──
      const footerY = doc.page.height - 60;
      doc
        .moveTo(50, footerY)
        .lineTo(doc.page.width - 50, footerY)
        .strokeColor('#e4e4e7')
        .lineWidth(0.5)
        .stroke();

      doc.fontSize(8).fillColor('#a1a1aa');
      doc.text(
        `Generated by ComSpace • ${data.invoiceNumber} • Verify at ${FRONTEND_URL}/verify/invoice/${data.verificationToken.substring(0, 8)}...`,
        50, footerY + 8,
        { align: 'center', width: doc.page.width - 100 }
      );

      doc.end();

      writeStream.on('finish', () => {
        const buffer = Buffer.concat(bufferChunks);
        resolve({ filePath, fileName, buffer });
      });

      writeStream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get the invoice HTML for embedding in email (with QR code as inline base64 image)
 */
export function generateInvoiceEmailHTML(
  data: InvoiceData,
  qrCodeDataUrl: string
): string {
  const primaryColor = data.branding?.primaryColor || '#9333ea';
  const storeName = data.branding?.storeName || data.from.name;
  const typeLabel = data.type === 'receipt' ? 'Receipt' : 'Invoice';
  const fmt = (n: number) => formatCurrency(n, data.currency);

  const itemRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#3f3f46;font-size:13px;">${item.description}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;color:#3f3f46;font-size:13px;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;color:#3f3f46;font-size:13px;">${fmt(item.unitPrice)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;color:#18181b;font-size:13px;font-weight:600;">${fmt(item.total)}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${typeLabel} ${data.invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:${primaryColor};padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#ffffff;font-size:22px;font-weight:bold;">${storeName}</td>
                  <td style="text-align:right;">
                    <span style="color:#ffffffcc;font-size:14px;">${typeLabel}</span><br/>
                    <span style="color:#ffffff;font-size:16px;font-weight:bold;">#${data.invoiceNumber}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Parties -->
          <tr>
            <td style="padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" valign="top">
                    <p style="margin:0;font-size:10px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">From</p>
                    <p style="margin:4px 0 0;font-weight:600;color:#18181b;">${data.from.name}</p>
                    <p style="margin:2px 0;font-size:12px;color:#3f3f46;">${data.from.email}</p>
                    ${data.from.phone ? `<p style="margin:2px 0;font-size:12px;color:#3f3f46;">${data.from.phone}</p>` : ''}
                    ${data.from.address ? `<p style="margin:2px 0;font-size:12px;color:#3f3f46;">${data.from.address}</p>` : ''}
                    ${data.from.registrationNumber ? `<p style="margin:4px 0 0;font-size:11px;color:#a1a1aa;">Reg: ${data.from.registrationNumber}</p>` : ''}
                  </td>
                  <td width="50%" valign="top">
                    <p style="margin:0;font-size:10px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Bill To</p>
                    <p style="margin:4px 0 0;font-weight:600;color:#18181b;">${data.to.name}</p>
                    <p style="margin:2px 0;font-size:12px;color:#3f3f46;">${data.to.email}</p>
                    ${data.to.phone ? `<p style="margin:2px 0;font-size:12px;color:#3f3f46;">${data.to.phone}</p>` : ''}
                    ${data.to.address ? `<p style="margin:2px 0;font-size:12px;color:#3f3f46;">${data.to.address}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Dates -->
          <tr>
            <td style="padding:0 32px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:8px;padding:12px 16px;">
                <tr>
                  <td style="font-size:12px;color:#71717a;">Issue Date: <strong style="color:#18181b;">${new Date(data.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></td>
                  ${data.orderNumber ? `<td style="font-size:12px;color:#71717a;text-align:center;">Order: <strong style="color:#18181b;">#${data.orderNumber}</strong></td>` : ''}
                  ${data.paidAt ? `<td style="font-size:12px;color:#16a34a;text-align:right;font-weight:600;">✓ Paid ${new Date(data.paidAt).toLocaleDateString('en-GB')}</td>` : ''}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding:0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <thead>
                  <tr style="background:#f4f4f5;">
                    <th style="text-align:left;padding:10px 12px;font-size:11px;color:#71717a;text-transform:uppercase;">Item</th>
                    <th style="text-align:center;padding:10px 12px;font-size:11px;color:#71717a;text-transform:uppercase;">Qty</th>
                    <th style="text-align:right;padding:10px 12px;font-size:11px;color:#71717a;text-transform:uppercase;">Price</th>
                    <th style="text-align:right;padding:10px 12px;font-size:11px;color:#71717a;text-transform:uppercase;">Total</th>
                  </tr>
                </thead>
                <tbody>${itemRows}</tbody>
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="padding:16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="55%"></td>
                  <td width="45%">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#71717a;">Subtotal</td>
                        <td style="padding:4px 0;text-align:right;font-size:13px;color:#18181b;">${fmt(data.subtotal)}</td>
                      </tr>
                      ${data.taxAmount > 0 ? `
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#71717a;">Tax (${(data.taxRate * 100).toFixed(0)}%)</td>
                        <td style="padding:4px 0;text-align:right;font-size:13px;color:#18181b;">${fmt(data.taxAmount)}</td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#71717a;">Shipping</td>
                        <td style="padding:4px 0;text-align:right;font-size:13px;color:#18181b;">${data.shippingFee === 0 ? 'Free' : fmt(data.shippingFee)}</td>
                      </tr>
                      ${data.discount > 0 ? `
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#71717a;">Discount</td>
                        <td style="padding:4px 0;text-align:right;font-size:13px;color:#dc2626;">-${fmt(data.discount)}</td>
                      </tr>` : ''}
                      <tr>
                        <td colspan="2" style="padding:8px 0 0;"><hr style="border:none;border-top:2px solid ${primaryColor};"/></td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;font-size:18px;font-weight:bold;color:${primaryColor};">Total</td>
                        <td style="padding:8px 0;text-align:right;font-size:18px;font-weight:bold;color:${primaryColor};">${fmt(data.total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- QR Code -->
          <tr>
            <td style="padding:16px 32px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="display:inline-table;border:1px solid #e4e4e7;border-radius:12px;padding:16px;">
                <tr>
                  <td style="text-align:center;">
                    <img src="${qrCodeDataUrl}" alt="Verification QR Code" width="120" height="120" style="display:block;margin:0 auto;" />
                    <p style="margin:8px 0 0;font-size:10px;color:#71717a;">Scan to verify authenticity</p>
                    <p style="margin:4px 0 0;font-size:9px;color:#a1a1aa;">${FRONTEND_URL}/verify/invoice/${data.verificationToken.substring(0, 16)}...</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${data.notes ? `
          <!-- Notes -->
          <tr>
            <td style="padding:0 32px 16px;">
              <p style="margin:0;font-size:10px;color:#71717a;text-transform:uppercase;">Notes</p>
              <p style="margin:4px 0;font-size:12px;color:#3f3f46;">${data.notes}</p>
            </td>
          </tr>` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;font-size:11px;color:#71717a;">
                &copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.
              </p>
              <p style="margin:4px 0 0;font-size:10px;color:#a1a1aa;">
                This is a computer-generated ${typeLabel.toLowerCase()}. Verify at ${FRONTEND_URL}/verify/invoice/${data.verificationToken.substring(0, 8)}...
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
