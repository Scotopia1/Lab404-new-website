import { mailerService } from './mailer.service';
import { logger } from '../utils/logger';

export type NotificationType =
  | 'new_order'
  | 'order_status_change'
  | 'low_stock_alert'
  | 'new_customer'
  | 'new_contact_message'
  | 'quotation_request'
  | 'payment_received'
  | 'refund_processed';

interface NotificationData {
  [key: string]: string | number | boolean | undefined;
}

interface NotificationSettings {
  enabled: boolean;
  adminEmails: string[];
  notifications: {
    [key in NotificationType]: boolean;
  };
}

// Default notification settings
const defaultSettings: NotificationSettings = {
  enabled: true,
  adminEmails: [process.env['ADMIN_EMAIL'] || 'admin@lab404electronics.com'],
  notifications: {
    new_order: true,
    order_status_change: true,
    low_stock_alert: true,
    new_customer: true,
    new_contact_message: true,
    quotation_request: true,
    payment_received: true,
    refund_processed: true,
  },
};

// Helper to get data value safely
function getData(data: NotificationData, key: string): string {
  const value = data[key];
  return value !== undefined ? String(value) : '';
}

interface QuotationEmailData {
  quotationNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  validUntil: Date | null;
  currency: string;
  itemCount: number;
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
}

class NotificationService {
  private settings: NotificationSettings = defaultSettings;

  updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    logger.info('Notification settings updated', { settings: this.settings });
  }

  getSettings(): NotificationSettings {
    return this.settings;
  }

  async notify(type: NotificationType, data: NotificationData): Promise<boolean> {
    if (!this.settings.enabled || !this.settings.notifications[type]) {
      logger.debug('Notification skipped - disabled', { type });
      return false;
    }

    const template = this.getTemplate(type, data);
    if (!template) {
      logger.warn('No template found for notification type', { type });
      return false;
    }

    return mailerService.sendEmail({
      to: this.settings.adminEmails,
      subject: template.subject,
      html: template.html,
    });
  }

  private getAdminUrl(): string {
    return process.env['ADMIN_URL'] || 'http://localhost:3001';
  }

  private getTemplate(type: NotificationType, data: NotificationData): { subject: string; html: string } | null {
    const adminUrl = this.getAdminUrl();

    const templates: Record<NotificationType, () => { subject: string; html: string }> = {
      new_order: () => ({
        subject: `New Order #${getData(data, 'orderId')} - Lab404 Electronics`,
        html: this.wrapTemplate(`
          <h2>New Order Received</h2>
          <p>A new order has been placed on your store.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Order ID:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">#${getData(data, 'orderId')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Customer:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, 'customerName')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, 'customerEmail')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">$${getData(data, 'total')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Items:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, 'itemCount')} item(s)</td>
            </tr>
          </table>
          <p><a href="${adminUrl}/orders/${getData(data, 'orderId')}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Order</a></p>
        `),
      }),

      order_status_change: () => ({
        subject: `Order #${getData(data, 'orderId')} Status Changed to ${getData(data, 'newStatus')}`,
        html: this.wrapTemplate(`
          <h2>Order Status Updated</h2>
          <p>Order #${getData(data, 'orderId')} status has been changed.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Order ID:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">#${getData(data, 'orderId')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Previous Status:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, 'previousStatus')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>New Status:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong style="color: #2563eb;">${getData(data, 'newStatus')}</strong></td>
            </tr>
          </table>
          <p><a href="${adminUrl}/orders/${getData(data, 'orderId')}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Order</a></p>
        `),
      }),

      low_stock_alert: () => ({
        subject: `Low Stock Alert: ${getData(data, 'productName')}`,
        html: this.wrapTemplate(`
          <h2 style="color: #dc2626;">Low Stock Alert</h2>
          <p>The following product is running low on stock:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Product:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, 'productName')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>SKU:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, 'sku')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Current Stock:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd; color: #dc2626;"><strong>${getData(data, 'currentStock')}</strong></td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Threshold:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, 'threshold')}</td>
            </tr>
          </table>
          <p><a href="${adminUrl}/products/${getData(data, 'productId')}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Update Stock</a></p>
        `),
      }),

      new_customer: () => ({
        subject: `New Customer Registration - ${getData(data, 'customerName')}`,
        html: this.wrapTemplate(`
          <h2>New Customer Registered</h2>
          <p>A new customer has registered on your store.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Name:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, 'customerName')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, 'customerEmail')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Registered:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
          <p><a href="${adminUrl}/customers/${getData(data, 'customerId')}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Customer</a></p>
        `),
      }),

      new_contact_message: () => ({
        subject: `New Contact Message from ${getData(data, 'name')}`,
        html: this.wrapTemplate(`
          <h2>New Contact Message</h2>
          <p>You have received a new message through the contact form.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Name:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, 'name')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, 'email')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Subject:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, 'subject')}</td>
            </tr>
          </table>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <strong>Message:</strong>
            <p style="margin-top: 10px;">${getData(data, 'message')}</p>
          </div>
        `),
      }),

      quotation_request: () => ({
        subject: `New Quotation Request #${getData(data, 'quotationId')}`,
        html: this.wrapTemplate(`
          <h2>New Quotation Request</h2>
          <p>A new quotation request has been submitted.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Quotation ID:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">#${getData(data, 'quotationId')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Customer:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, 'customerName')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, 'customerEmail')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Items:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, 'itemCount')} item(s)</td>
            </tr>
          </table>
          <p><a href="${adminUrl}/quotations/${getData(data, 'quotationId')}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Quotation</a></p>
        `),
      }),

      payment_received: () => ({
        subject: `Payment Received for Order #${getData(data, 'orderId')}`,
        html: this.wrapTemplate(`
          <h2 style="color: #16a34a;">Payment Received</h2>
          <p>Payment has been successfully received for an order.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Order ID:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">#${getData(data, 'orderId')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Amount:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd; color: #16a34a;"><strong>$${getData(data, 'amount')}</strong></td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Payment Method:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, 'paymentMethod')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Transaction ID:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, 'transactionId')}</td>
            </tr>
          </table>
          <p><a href="${adminUrl}/orders/${getData(data, 'orderId')}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Order</a></p>
        `),
      }),

      refund_processed: () => ({
        subject: `Refund Processed for Order #${getData(data, 'orderId')}`,
        html: this.wrapTemplate(`
          <h2 style="color: #f59e0b;">Refund Processed</h2>
          <p>A refund has been processed for an order.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Order ID:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">#${getData(data, 'orderId')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Refund Amount:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd; color: #f59e0b;"><strong>$${getData(data, 'amount')}</strong></td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Reason:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${getData(data, 'reason')}</td>
            </tr>
          </table>
          <p><a href="${adminUrl}/orders/${getData(data, 'orderId')}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Order</a></p>
        `),
      }),
    };

    const templateFn = templates[type];
    return templateFn ? templateFn() : null;
  }

  private wrapTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Lab404 Electronics</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Admin Notification</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            ${content}
          </div>
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>This is an automated notification from Lab404 Electronics Admin.</p>
            <p>&copy; ${new Date().getFullYear()} Lab404 Electronics. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send quotation email to customer with PDF attachment
   */
  async sendQuotationToCustomer(
    data: QuotationEmailData,
    pdfBuffer: Buffer
  ): Promise<boolean> {
    const formatCurrency = (amount: number, currency: string) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
      }).format(amount);
    };

    const formatDate = (date: Date | null) => {
      if (!date) return 'No expiration';
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const html = this.wrapCustomerTemplate(`
      <h2>Quotation ${data.quotationNumber}</h2>
      <p>Dear ${data.customerName},</p>
      <p>Thank you for your interest. Please find attached your quotation from ${data.companyName}.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Quotation Number:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${data.quotationNumber}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Items:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${data.itemCount} item(s)</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Amount:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong style="color: #2563eb;">${formatCurrency(data.total, data.currency)}</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Valid Until:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${formatDate(data.validUntil)}</td>
        </tr>
      </table>

      <p>The detailed quotation is attached as a PDF document.</p>

      <p>If you have any questions or would like to proceed with this quotation, please don't hesitate to contact us:</p>
      <ul style="list-style: none; padding: 0;">
        ${data.companyEmail ? `<li style="padding: 5px 0;">Email: <a href="mailto:${data.companyEmail}">${data.companyEmail}</a></li>` : ''}
        ${data.companyPhone ? `<li style="padding: 5px 0;">Phone: ${data.companyPhone}</li>` : ''}
      </ul>

      <p>We look forward to doing business with you!</p>
      <p>Best regards,<br/>${data.companyName}</p>
    `, data.companyName);

    return mailerService.sendEmail({
      to: data.customerEmail,
      subject: `Quotation ${data.quotationNumber} from ${data.companyName}`,
      html,
      attachments: [
        {
          filename: `${data.quotationNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  private wrapCustomerTemplate(content: string, companyName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${companyName}</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            ${content}
          </div>
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send verification code email
   */
  async sendVerificationCode(data: {
    email: string;
    code: string;
    type: 'password_reset' | 'email_verification' | 'account_unlock';
    expiryMinutes: number;
  }): Promise<boolean> {
    const { email, code, type, expiryMinutes } = data;
    const companyName = process.env.COMPANY_NAME || 'Lab404 Electronics';

    // Subject based on type
    const subjects = {
      password_reset: 'Password Reset Verification Code',
      email_verification: 'Email Verification Code',
      account_unlock: 'Account Unlock Verification Code',
    };
    const subject = subjects[type];

    // Title based on type
    const titles = {
      password_reset: 'Reset Your Password',
      email_verification: 'Verify Your Email',
      account_unlock: 'Unlock Your Account',
    };
    const title = titles[type];

    const html = this.wrapCustomerTemplate(`
      <h2 style="color: #1f2937; margin-bottom: 24px;">${title}</h2>

      <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 20px;">
        Your verification code is:
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; background: #f3f4f6; padding: 20px 40px; border-radius: 8px; border: 2px dashed #d1d5db;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937; font-family: 'Courier New', monospace;">
            ${code}
          </span>
        </div>
      </div>

      <p style="color: #dc2626; font-weight: bold; font-size: 14px; margin: 20px 0;">
        ⚠️ This code will expire in ${expiryMinutes} minutes.
      </p>

      <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin-top: 30px;">
        If you didn't request this code, please ignore this email or contact our support team if you have concerns.
      </p>
    `, companyName);

    logger.info('Sending verification code email', { email, type });

    return mailerService.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send quotation expiry reminder to customer
   */
  async sendQuotationExpiryReminder(
    customerEmail: string,
    customerName: string,
    quotationNumber: string,
    daysUntilExpiry: number,
    expiryDate: Date,
    acceptanceToken?: string
  ): Promise<boolean> {
    const companyName = process.env.COMPANY_NAME || 'Lab404 Electronics';
    const websiteUrl = process.env.WEBSITE_URL || 'https://lab404electronics.com';

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const urgencyColor = daysUntilExpiry <= 1 ? '#dc2626' : daysUntilExpiry <= 3 ? '#f59e0b' : '#3b82f6';
    const urgencyText = daysUntilExpiry <= 1 ? 'Expires Tomorrow!' : `Expires in ${daysUntilExpiry} Days`;

    const viewLink = acceptanceToken
      ? `${websiteUrl}/quotations/view/${acceptanceToken}`
      : null;

    const html = this.wrapCustomerTemplate(`
      <div style="text-align: center; padding: 20px 0;">
        <span style="background: ${urgencyColor}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px;">
          ${urgencyText}
        </span>
      </div>

      <h2>Quotation Expiry Reminder</h2>
      <p>Dear ${customerName},</p>
      <p>This is a friendly reminder that your quotation <strong>${quotationNumber}</strong> will expire on <strong style="color: ${urgencyColor};">${formatDate(expiryDate)}</strong>.</p>

      <div style="background: #f8fafc; border-left: 4px solid ${urgencyColor}; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Don't miss out!</strong> Review and accept your quotation before it expires to secure your pricing.</p>
      </div>

      ${viewLink ? `
        <p style="text-align: center; margin: 30px 0;">
          <a href="${viewLink}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            View & Accept Quotation
          </a>
        </p>
      ` : ''}

      <p>If you have any questions or need to discuss the quotation, please don't hesitate to contact us.</p>

      <p>Best regards,<br/>${companyName}</p>
    `, companyName);

    return mailerService.sendEmail({
      to: customerEmail,
      subject: `${urgencyText}: Quotation ${quotationNumber} - ${companyName}`,
      html,
    });
  }
}

export const notificationService = new NotificationService();
