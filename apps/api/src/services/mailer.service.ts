import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class MailerService {
  private transporter: Transporter | null = null;
  private fromEmail: string;
  private fromName: string;
  private isConfigured: boolean = false;

  constructor() {
    this.fromEmail = process.env['SMTP_FROM_EMAIL'] || 'noreply@lab404electronics.com';
    this.fromName = process.env['SMTP_FROM_NAME'] || 'Lab404 Electronics';
    this.initialize();
  }

  private initialize() {
    const host = process.env['SMTP_HOST'];
    const port = parseInt(process.env['SMTP_PORT'] || '587', 10);
    const user = process.env['SMTP_USER'];
    const pass = process.env['SMTP_PASS'];

    if (!host || !user || !pass) {
      logger.warn('SMTP not configured. Email notifications will be disabled.');
      this.isConfigured = false;
      return;
    }

    const config: SMTPConfig = {
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    };

    this.transporter = nodemailer.createTransport(config);
    this.isConfigured = true;
    logger.info('SMTP mailer initialized', { host, port });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      logger.warn('Email not sent - SMTP not configured', { to: options.to, subject: options.subject });
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      });

      logger.info('Email sent successfully', { messageId: info.messageId, to: options.to });
      return true;
    } catch (error) {
      logger.error('Failed to send email', { error, to: options.to, subject: options.subject });
      return false;
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Verify SMTP connection
  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified');
      return true;
    } catch (error) {
      logger.error('SMTP connection verification failed', { error });
      return false;
    }
  }

  isReady(): boolean {
    return this.isConfigured;
  }
}

export const mailerService = new MailerService();
