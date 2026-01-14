/**
 * PDF Service
 * Handles PDF generation for quotations and invoices
 * Uses PDFKit for server-side PDF generation
 */

import PDFDocument from 'pdfkit';

interface QuotationItem {
  productName: string;
  sku?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  variantOptions?: Record<string, string>;
  imageUrl?: string;
  productUrl?: string; // URL to product page on website
}

interface QuotationData {
  quotationNumber: string;
  createdAt: Date;
  validUntil?: Date;
  status: string;

  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  customerAddress?: Record<string, string>;

  // Items
  items: QuotationItem[];

  // Totals (CALCULATED SERVER-SIDE)
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  currency: string;

  // Notes
  notes?: string;
  terms?: string;

  // Company info
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite?: string;
  companyLogo?: string;
}

interface InvoiceData extends QuotationData {
  invoiceNumber: string;
  orderNumber: string;
  paymentStatus: string;
  paymentMethod: string;
  paidAt?: Date;
}

interface PdfTemplateConfig {
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  showCompanyLogo?: boolean;
  showLineItemImages?: boolean;
  showLineItemDescription?: boolean;
  showSku?: boolean;
  headerText?: string;
  footerText?: string;
  thankYouMessage?: string;
}

export class PDFService {
  // Default colors (can be overridden by template)
  private primaryColor = '#1a1a2e';
  private accentColor = '#0066cc';
  private readonly textColor = '#333333';
  private readonly lightGray = '#f5f5f5';

  // Template config (set per generation)
  private template: PdfTemplateConfig = {};

  /**
   * Parse HTML content to plain text for PDF rendering
   * Converts HTML tags to readable plain text format
   */
  private parseHtmlToText(html: string): string {
    if (!html) {return '';}

    let text = html;

    // Replace <br> and <br/> with newlines
    text = text.replace(/<br\s*\/?>/gi, '\n');

    // Replace </p> with double newline (paragraph break)
    text = text.replace(/<\/p>/gi, '\n\n');

    // Replace <p> tags (opening) with nothing
    text = text.replace(/<p[^>]*>/gi, '');

    // Handle strong/bold - keep the text
    text = text.replace(/<\/?strong>/gi, '');
    text = text.replace(/<\/?b>/gi, '');

    // Handle emphasis/italic
    text = text.replace(/<\/?em>/gi, '');
    text = text.replace(/<\/?i>/gi, '');

    // Handle underline
    text = text.replace(/<\/?u>/gi, '');

    // Handle lists - convert to bullet points
    text = text.replace(/<li[^>]*>/gi, '• ');
    text = text.replace(/<\/li>/gi, '\n');
    text = text.replace(/<\/?[ou]l[^>]*>/gi, '\n');

    // Handle headings - add newlines
    text = text.replace(/<h[1-6][^>]*>/gi, '\n');
    text = text.replace(/<\/h[1-6]>/gi, '\n');

    // Handle div and span
    text = text.replace(/<\/?div[^>]*>/gi, '\n');
    text = text.replace(/<\/?span[^>]*>/gi, '');

    // Remove any remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');

    // Decode common HTML entities
    text = text.replace(/&nbsp;/gi, ' ');
    text = text.replace(/&amp;/gi, '&');
    text = text.replace(/&lt;/gi, '<');
    text = text.replace(/&gt;/gi, '>');
    text = text.replace(/&quot;/gi, '"');
    text = text.replace(/&#39;/gi, "'");
    text = text.replace(/&apos;/gi, "'");

    // Clean up multiple newlines (max 2)
    text = text.replace(/\n{3,}/g, '\n\n');

    // Trim whitespace from each line and remove leading/trailing whitespace
    text = text.split('\n').map(line => line.trim()).join('\n').trim();

    return text;
  }

  /**
   * Apply template configuration
   */
  private applyTemplate(template?: PdfTemplateConfig): void {
    this.template = template || {};
    if (template?.primaryColor) {
      this.primaryColor = template.primaryColor;
    } else {
      this.primaryColor = '#1a1a2e';
    }
    if (template?.accentColor) {
      this.accentColor = template.accentColor;
    } else {
      this.accentColor = '#0066cc';
    }
  }

  /**
   * Generate a quotation PDF
   */
  async generateQuotationPDF(data: QuotationData, template?: PdfTemplateConfig): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        this.applyTemplate(template);

        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Custom header text if provided
        if (this.template.headerText) {
          doc.fontSize(10).fillColor(this.textColor);
          doc.text(this.template.headerText, 50, 30, { align: 'center', width: 495 });
          doc.y = 50;
        }

        // Header
        this.addHeader(doc, data, 'QUOTATION');

        // Customer info
        this.addCustomerInfo(doc, data);

        // Items table
        this.addItemsTable(doc, data.items);

        // Totals
        this.addTotals(doc, data);

        // Thank you message if provided
        if (this.template.thankYouMessage) {
          doc.moveDown();
          doc.fontSize(11).fillColor(this.accentColor);
          doc.text(this.template.thankYouMessage, 50, doc.y, { align: 'center', width: 495 });
        }

        // Notes and terms
        this.addNotesAndTerms(doc, data);

        // Footer
        this.addFooter(doc, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate an invoice PDF
   */
  async generateInvoicePDF(data: InvoiceData, template?: PdfTemplateConfig): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        this.applyTemplate(template);

        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Custom header text if provided
        if (this.template.headerText) {
          doc.fontSize(10).fillColor(this.textColor);
          doc.text(this.template.headerText, 50, 30, { align: 'center', width: 495 });
          doc.y = 50;
        }

        // Header
        this.addHeader(doc, data, 'INVOICE');

        // Invoice-specific info
        doc.fontSize(10).fillColor(this.textColor);
        doc.text(`Invoice #: ${data.invoiceNumber}`, 50, doc.y);
        doc.text(`Order #: ${data.orderNumber}`);
        doc.text(`Payment Status: ${data.paymentStatus.toUpperCase()}`);
        if (data.paidAt) {
          doc.text(`Paid On: ${data.paidAt.toLocaleDateString()}`);
        }
        doc.moveDown();

        // Customer info
        this.addCustomerInfo(doc, data);

        // Items table
        this.addItemsTable(doc, data.items);

        // Totals
        this.addTotals(doc, data);

        // Payment info
        if (data.paymentMethod) {
          doc.moveDown();
          doc.fontSize(10).fillColor(this.textColor);
          doc.text(`Payment Method: ${data.paymentMethod.toUpperCase()}`);
        }

        // Thank you message if provided
        if (this.template.thankYouMessage) {
          doc.moveDown();
          doc.fontSize(11).fillColor(this.accentColor);
          doc.text(this.template.thankYouMessage, 50, doc.y, { align: 'center', width: 495 });
        }

        // Footer
        this.addFooter(doc, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private addHeader(doc: PDFKit.PDFDocument, data: QuotationData, title: string): void {
    // Company name/logo
    doc.fontSize(24).fillColor(this.primaryColor);
    doc.text(data.companyName, 50, 50);

    // Title
    doc.fontSize(20).fillColor(this.accentColor);
    doc.text(title, 400, 50, { align: 'right' });

    // Document info
    doc.fontSize(10).fillColor(this.textColor);
    doc.text(`#: ${data.quotationNumber}`, 400, 80, { align: 'right' });
    doc.text(`Date: ${data.createdAt.toLocaleDateString()}`, { align: 'right' });
    if (data.validUntil) {
      doc.text(`Valid Until: ${data.validUntil.toLocaleDateString()}`, { align: 'right' });
    }

    // Company details (address, phone, email)
    doc.fontSize(9).fillColor('#666666');
    if (data.companyAddress) {
      doc.text(data.companyAddress, 50, 80);
    }
    if (data.companyPhone) {
      doc.text(`Phone: ${data.companyPhone}`);
    }
    if (data.companyEmail) {
      doc.text(`Email: ${data.companyEmail}`);
    }
    if (data.companyWebsite) {
      doc.text(`Web: ${data.companyWebsite}`);
    }

    // Divider
    doc.moveTo(50, 150).lineTo(545, 150).stroke(this.lightGray);
    doc.y = 160;
  }

  private addCustomerInfo(doc: PDFKit.PDFDocument, data: QuotationData): void {
    doc.fontSize(12).fillColor(this.primaryColor);
    doc.text('Bill To:', 50, doc.y);

    doc.fontSize(10).fillColor(this.textColor);
    doc.text(data.customerName);
    if (data.customerCompany) {
      doc.text(data.customerCompany);
    }
    doc.text(data.customerEmail);
    if (data.customerPhone) {
      doc.text(data.customerPhone);
    }

    doc.moveDown(2);
  }

  private addItemsTable(doc: PDFKit.PDFDocument, items: QuotationItem[]): void {
    const tableTop = doc.y;
    const tableLeft = 50;
    const showSku = this.template.showSku !== false; // Default true
    const showDescription = this.template.showLineItemDescription === true;

    // Table header - adjust columns based on showSku
    doc.rect(tableLeft, tableTop, 495, 25).fill(this.primaryColor);
    doc.fontSize(10).fillColor('#ffffff');

    if (showSku) {
      doc.text('Product', tableLeft + 10, tableTop + 8);
      doc.text('SKU', tableLeft + 210, tableTop + 8);
      doc.text('Qty', tableLeft + 290, tableTop + 8);
      doc.text('Price', tableLeft + 350, tableTop + 8);
      doc.text('Total', tableLeft + 420, tableTop + 8);
    } else {
      doc.text('Product', tableLeft + 10, tableTop + 8);
      doc.text('Qty', tableLeft + 290, tableTop + 8);
      doc.text('Price', tableLeft + 350, tableTop + 8);
      doc.text('Total', tableLeft + 420, tableTop + 8);
    }

    // Table rows
    let y = tableTop + 30;
    doc.fillColor(this.textColor);

    items.forEach((item, index) => {
      const rowHeight = showDescription && item.description ? 40 : 25;

      // Alternate row background
      if (index % 2 === 0) {
        doc.rect(tableLeft, y - 5, 495, rowHeight).fill(this.lightGray);
        doc.fillColor(this.textColor);
      }

      doc.fontSize(9);

      // Product name with variant options
      let productName = item.productName;
      if (item.variantOptions) {
        const options = Object.entries(item.variantOptions)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        productName += ` (${options})`;
      }

      // Truncate long names based on whether SKU is shown
      const maxNameLength = showSku ? 40 : 60;
      if (productName.length > maxNameLength) {
        productName = productName.substring(0, maxNameLength - 3) + '...';
      }

      // Product name - make it a clickable link if URL is provided
      if (item.productUrl) {
        doc.fillColor(this.accentColor);
        doc.text(productName, tableLeft + 10, y, {
          width: showSku ? 190 : 270,
          link: item.productUrl,
          underline: true,
        });
        doc.fillColor(this.textColor);
      } else {
        doc.text(productName, tableLeft + 10, y, { width: showSku ? 190 : 270 });
      }

      if (showSku) {
        doc.text(item.sku || '-', tableLeft + 210, y, { width: 70 });
      }

      doc.text(item.quantity.toString(), tableLeft + 290, y, { width: 50 });
      doc.text(`$${item.unitPrice.toFixed(2)}`, tableLeft + 350, y, { width: 60 });
      doc.text(`$${item.lineTotal.toFixed(2)}`, tableLeft + 420, y, { width: 70 });

      // Show description if enabled
      if (showDescription && item.description) {
        doc.fontSize(8).fillColor('#666666');
        const desc = item.description.length > 80
          ? item.description.substring(0, 77) + '...'
          : item.description;
        doc.text(desc, tableLeft + 10, y + 12, { width: 270 });
        doc.fillColor(this.textColor);
      }

      y += rowHeight;

      // New page if needed
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });

    // Table border
    doc.rect(tableLeft, tableTop, 495, y - tableTop).stroke('#cccccc');

    doc.y = y + 10;
  }

  private addTotals(doc: PDFKit.PDFDocument, data: QuotationData): void {
    const totalsX = 350;
    let y = doc.y + 10;

    doc.fontSize(10).fillColor(this.textColor);

    // Subtotal
    doc.text('Subtotal:', totalsX, y);
    doc.text(`$${data.subtotal.toFixed(2)}`, totalsX + 100, y, { align: 'right', width: 95 });
    y += 20;

    // Discount (if any)
    if (data.discountAmount > 0) {
      doc.text('Discount:', totalsX, y);
      doc.fillColor('#cc0000');
      doc.text(`-$${data.discountAmount.toFixed(2)}`, totalsX + 100, y, { align: 'right', width: 95 });
      doc.fillColor(this.textColor);
      y += 20;
    }

    // Tax
    doc.text(`Tax (${(data.taxRate * 100).toFixed(0)}%):`, totalsX, y);
    doc.text(`$${data.taxAmount.toFixed(2)}`, totalsX + 100, y, { align: 'right', width: 95 });
    y += 20;

    // Shipping
    if (data.shippingAmount > 0) {
      doc.text('Shipping:', totalsX, y);
      doc.text(`$${data.shippingAmount.toFixed(2)}`, totalsX + 100, y, { align: 'right', width: 95 });
      y += 20;
    }

    // Divider
    doc.moveTo(totalsX, y).lineTo(545, y).stroke('#cccccc');
    y += 10;

    // Total
    doc.fontSize(14).fillColor(this.primaryColor);
    doc.text('Total:', totalsX, y);
    doc.text(`${data.currency} $${data.total.toFixed(2)}`, totalsX + 100, y, { align: 'right', width: 95 });

    doc.y = y + 30;
  }

  private addNotesAndTerms(doc: PDFKit.PDFDocument, data: QuotationData): void {
    if (data.notes || data.terms) {
      doc.moveDown();

      if (data.notes) {
        doc.fontSize(11).fillColor(this.primaryColor);
        doc.text('Notes:', 50, doc.y);
        doc.fontSize(9).fillColor(this.textColor);
        doc.text(data.notes, { width: 495 });
        doc.moveDown();
      }

      if (data.terms) {
        doc.fontSize(11).fillColor(this.primaryColor);
        doc.text('Terms & Conditions:', 50, doc.y);
        doc.fontSize(9).fillColor(this.textColor);
        // Parse HTML to plain text for PDF rendering
        const parsedTerms = this.parseHtmlToText(data.terms);
        doc.text(parsedTerms, { width: 495 });
      }
    }
  }

  private addFooter(doc: PDFKit.PDFDocument, data: QuotationData): void {
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      // Footer line
      doc.moveTo(50, 780).lineTo(545, 780).stroke(this.lightGray);

      // Footer text - use template footer or default
      const footerText = this.template.footerText
        || `Generated by ${data.companyName} | Page ${i + 1} of ${pageCount}`;

      doc.fontSize(8).fillColor('#666666');
      doc.text(
        footerText,
        50,
        785,
        { align: 'center', width: 495 }
      );
    }
  }

  /**
   * Generate PDF stream for direct response
   */
  generatePDFStream(data: QuotationData, type: 'quotation' | 'invoice' = 'quotation'): PDFKit.PDFDocument {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
    });

    // Add content based on type
    if (type === 'quotation') {
      this.addHeader(doc, data, 'QUOTATION');
    } else {
      this.addHeader(doc, data, 'INVOICE');
    }

    this.addCustomerInfo(doc, data);
    this.addItemsTable(doc, data.items);
    this.addTotals(doc, data);
    this.addNotesAndTerms(doc, data);
    this.addFooter(doc, data);

    doc.end();

    return doc;
  }
}

export const pdfService = new PDFService();
