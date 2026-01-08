/**
 * Email Templates Service
 *
 * Generates HTML email templates for order notifications and confirmations.
 * Uses inline CSS and table-based layouts for email client compatibility.
 */

interface AddressJson {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone: string;
  email: string;
}

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: AddressJson;
  items: Array<{
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  promoCode?: string;
  customerNotes?: string;
  orderDate: string;
  paymentMethod: string;
}

class EmailTemplatesService {
  /**
   * Generate customer order confirmation email HTML
   */
  generateOrderConfirmationEmail(data: OrderEmailData): string {
    const itemsHtml = data.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #1f2937;">
          <strong>${this.escapeHtml(item.productName)}</strong><br>
          <span style="color: #6b7280; font-size: 12px;">SKU: ${this.escapeHtml(item.sku)}</span>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #1f2937;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 14px; color: #1f2937;">
          ${this.formatCurrency(item.lineTotal, data.currency)}
        </td>
      </tr>
    `
      )
      .join('');

    const content = `
      <!-- Order Confirmation Message -->
      <tr>
        <td style="padding: 40px 40px 20px;">
          <h2 style="margin: 0 0 10px; color: #1f2937; font-size: 24px; font-weight: bold;">Order Confirmed!</h2>
          <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.5;">
            Thank you for your order. We'll prepare it and contact you for delivery.
          </p>
        </td>
      </tr>

      <!-- Order Number -->
      <tr>
        <td style="padding: 0 40px 30px;">
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; text-align: center;">
            <p style="margin: 0 0 5px; font-size: 14px; color: #6b7280;">Order Number</p>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1f2937;">#${this.escapeHtml(data.orderNumber)}</p>
          </div>
        </td>
      </tr>

      <!-- Order Items -->
      <tr>
        <td style="padding: 0 40px 30px;">
          <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 18px; font-weight: bold;">Order Details</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px 8px; text-align: left; font-size: 14px; color: #6b7280; font-weight: 600;">Item</th>
                <th style="padding: 12px 8px; text-align: center; font-size: 14px; color: #6b7280; font-weight: 600;">Qty</th>
                <th style="padding: 12px 8px; text-align: right; font-size: 14px; color: #6b7280; font-weight: 600;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </td>
      </tr>

      <!-- Price Breakdown -->
      <tr>
        <td style="padding: 0 40px 30px;">
          <table width="100%" cellpadding="8" cellspacing="0">
            <tr>
              <td style="font-size: 14px; color: #6b7280;">Subtotal</td>
              <td style="text-align: right; font-size: 14px; color: #1f2937;">${this.formatCurrency(data.subtotal, data.currency)}</td>
            </tr>
            ${
              data.discountAmount > 0
                ? `
            <tr>
              <td style="font-size: 14px; color: #6b7280;">
                Discount ${data.promoCode ? `(${this.escapeHtml(data.promoCode)})` : ''}
              </td>
              <td style="text-align: right; font-size: 14px; color: #10b981;">-${this.formatCurrency(data.discountAmount, data.currency)}</td>
            </tr>
            `
                : ''
            }
            <tr>
              <td style="font-size: 14px; color: #6b7280;">Tax (${(data.taxRate * 100).toFixed(0)}%)</td>
              <td style="text-align: right; font-size: 14px; color: #1f2937;">${this.formatCurrency(data.taxAmount, data.currency)}</td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #6b7280;">Shipping</td>
              <td style="text-align: right; font-size: 14px; color: #1f2937;">
                ${data.shippingAmount > 0 ? this.formatCurrency(data.shippingAmount, data.currency) : 'Free'}
              </td>
            </tr>
            <tr style="border-top: 2px solid #e5e7eb;">
              <td style="font-size: 18px; font-weight: bold; color: #1f2937; padding-top: 12px;">Total</td>
              <td style="text-align: right; font-size: 18px; font-weight: bold; color: #1f2937; padding-top: 12px;">
                ${this.formatCurrency(data.total, data.currency)}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- COD Payment Notice -->
      <tr>
        <td style="padding: 0 40px 30px;">
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.6;">
              <strong>Payment Method:</strong> Cash on Delivery (COD)<br>
              Pay with cash when you receive your order.
            </p>
          </div>
        </td>
      </tr>

      <!-- Shipping Address -->
      <tr>
        <td style="padding: 0 40px 30px;">
          <h3 style="margin: 0 0 10px; color: #1f2937; font-size: 18px; font-weight: bold;">Shipping Address</h3>
          <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.8;">
            ${this.formatAddress(data.shippingAddress)}
          </p>
        </td>
      </tr>

      ${
        data.customerNotes
          ? `
      <!-- Customer Notes -->
      <tr>
        <td style="padding: 0 40px 30px;">
          <h3 style="margin: 0 0 10px; color: #1f2937; font-size: 18px; font-weight: bold;">Order Notes</h3>
          <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
            ${this.escapeHtml(data.customerNotes)}
          </p>
        </td>
      </tr>
      `
          : ''
      }
    `;

    return this.generateEmailLayout(content, `Order Confirmation - #${data.orderNumber}`);
  }

  /**
   * Generate admin new order notification email HTML
   */
  generateNewOrderNotificationEmail(data: OrderEmailData): string {
    const itemsHtml = data.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #1f2937;">
          <strong>${this.escapeHtml(item.productName)}</strong><br>
          <span style="color: #6b7280; font-size: 12px;">SKU: ${this.escapeHtml(item.sku)}</span>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #1f2937;">
          ${item.quantity}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 14px; color: #1f2937;">
          ${this.formatCurrency(item.lineTotal, data.currency)}
        </td>
      </tr>
    `
      )
      .join('');

    const content = `
      <tr>
        <td style="padding: 40px;">
          <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: bold;">New Order Received</h2>

          <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px; color: #1e40af;">
              <strong>Order Number:</strong> #${this.escapeHtml(data.orderNumber)}
            </p>
          </div>

          <h3 style="margin: 0 0 10px; color: #1f2937; font-size: 18px; font-weight: bold;">Customer</h3>
          <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
            <strong>${this.escapeHtml(data.customerName)}</strong><br>
            ${this.escapeHtml(data.customerEmail)}<br>
            ${this.escapeHtml(data.shippingAddress.phone)}
          </p>

          <h3 style="margin: 0 0 10px; color: #1f2937; font-size: 18px; font-weight: bold;">Order Summary</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; margin-bottom: 20px; border-radius: 6px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px 8px; text-align: left; font-size: 14px; color: #6b7280; font-weight: 600;">Item</th>
                <th style="padding: 12px 8px; text-align: center; font-size: 14px; color: #6b7280; font-weight: 600;">Qty</th>
                <th style="padding: 12px 8px; text-align: right; font-size: 14px; color: #6b7280; font-weight: 600;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align: right; font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 20px;">
            Total: ${this.formatCurrency(data.total, data.currency)}
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Payment:</strong> Cash on Delivery (COD)
            </p>
          </div>

          <h3 style="margin: 0 0 10px; color: #1f2937; font-size: 18px; font-weight: bold;">Shipping Address</h3>
          <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
            ${this.formatAddress(data.shippingAddress)}
          </p>

          ${
            data.customerNotes
              ? `
          <h3 style="margin: 0 0 10px; color: #1f2937; font-size: 18px; font-weight: bold;">Customer Notes</h3>
          <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
            ${this.escapeHtml(data.customerNotes)}
          </p>
          `
              : ''
          }

          <div style="text-align: center; margin-top: 30px;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              Log in to your admin dashboard to view and manage this order.
            </p>
          </div>
        </td>
      </tr>
    `;

    return this.generateEmailLayout(content, `New Order: #${data.orderNumber}`);
  }

  /**
   * Generate email layout wrapper with header and footer
   */
  private generateEmailLayout(content: string, title: string): string {
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px;">

          <!-- Header -->
          <tr>
            <td style="background-color: #2563eb; color: #ffffff; padding: 30px 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">Lab404 Electronics</h1>
            </td>
          </tr>

          <!-- Content -->
          ${content}

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280; line-height: 1.6;">
                Questions? Contact us at <a href="mailto:contact@lab404electronics.com" style="color: #2563eb; text-decoration: none;">contact@lab404electronics.com</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                &copy; 2026 Lab404 Electronics. All rights reserved.
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

  /**
   * Format currency for display
   */
  private formatCurrency(amount: number, currency: string): string {
    // Simple USD formatting - can be extended for other currencies
    return `$${amount.toFixed(2)}`;
  }

  /**
   * Format address for display
   */
  private formatAddress(address: AddressJson): string {
    const parts: string[] = [];

    parts.push(`<strong>${this.escapeHtml(address.firstName)} ${this.escapeHtml(address.lastName)}</strong>`);
    parts.push(this.escapeHtml(address.addressLine1));

    if (address.addressLine2) {
      parts.push(this.escapeHtml(address.addressLine2));
    }

    const cityStateLine: string[] = [];
    cityStateLine.push(this.escapeHtml(address.city));
    if (address.state) {
      cityStateLine.push(this.escapeHtml(address.state));
    }
    if (address.postalCode) {
      cityStateLine.push(this.escapeHtml(address.postalCode));
    }
    parts.push(cityStateLine.join(', '));

    parts.push(this.escapeHtml(address.country));
    parts.push(this.escapeHtml(address.phone));

    return parts.join('<br>');
  }

  /**
   * Escape HTML to prevent XSS in email templates
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char] || char);
  }
}

export const emailTemplatesService = new EmailTemplatesService();
