/**
 * PDF Service
 * Handles PDF generation for quotations and invoices
 * Uses PDFKit for server-side PDF generation
 */

import PDFDocument from 'pdfkit';

interface QuotationItem {
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  variantOptions?: Record<string, string>;
}

interface QuotationData {
  quotationNumber: string;
  createdAt: Date;
  validUntil: Date;
  status: string;

  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;

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

export class PDFService {
  private readonly primaryColor = '#1a1a2e';
  private readonly accentColor = '#0066cc';
  private readonly textColor = '#333333';
  private readonly lightGray = '#f5f5f5';

  /**
   * Generate a quotation PDF
   */
  async generateQuotationPDF(data: QuotationData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        this.addHeader(doc, data, 'QUOTATION');

        // Customer info
        this.addCustomerInfo(doc, data);

        // Items table
        this.addItemsTable(doc, data.items);

        // Totals
        this.addTotals(doc, data);

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
  async generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

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
    doc.text(`Valid Until: ${data.validUntil.toLocaleDateString()}`, { align: 'right' });
    doc.text(`Status: ${data.status.toUpperCase()}`, { align: 'right' });

    // Company details
    doc.fontSize(9).fillColor('#666666');
    doc.text(data.companyAddress, 50, 80);
    doc.text(`Phone: ${data.companyPhone}`);
    doc.text(`Email: ${data.companyEmail}`);
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
    const colWidths = [200, 80, 80, 80, 80]; // Product, SKU, Qty, Price, Total

    // Table header
    doc.rect(tableLeft, tableTop, 495, 25).fill(this.primaryColor);
    doc.fontSize(10).fillColor('#ffffff');
    doc.text('Product', tableLeft + 10, tableTop + 8);
    doc.text('SKU', tableLeft + 210, tableTop + 8);
    doc.text('Qty', tableLeft + 290, tableTop + 8);
    doc.text('Price', tableLeft + 350, tableTop + 8);
    doc.text('Total', tableLeft + 420, tableTop + 8);

    // Table rows
    let y = tableTop + 30;
    doc.fillColor(this.textColor);

    items.forEach((item, index) => {
      // Alternate row background
      if (index % 2 === 0) {
        doc.rect(tableLeft, y - 5, 495, 25).fill(this.lightGray);
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

      // Truncate long names
      if (productName.length > 40) {
        productName = productName.substring(0, 37) + '...';
      }

      doc.text(productName, tableLeft + 10, y, { width: 190 });
      doc.text(item.sku || '-', tableLeft + 210, y, { width: 70 });
      doc.text(item.quantity.toString(), tableLeft + 290, y, { width: 50 });
      doc.text(`$${item.unitPrice.toFixed(2)}`, tableLeft + 350, y, { width: 60 });
      doc.text(`$${item.lineTotal.toFixed(2)}`, tableLeft + 420, y, { width: 70 });

      y += 25;

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
        doc.text(data.terms, { width: 495 });
      }
    }
  }

  private addFooter(doc: PDFKit.PDFDocument, data: QuotationData): void {
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      // Footer line
      doc.moveTo(50, 780).lineTo(545, 780).stroke(this.lightGray);

      // Footer text
      doc.fontSize(8).fillColor('#666666');
      doc.text(
        `Generated by ${data.companyName} | Page ${i + 1} of ${pageCount}`,
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
