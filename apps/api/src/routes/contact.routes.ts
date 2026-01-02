import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validator';
import { strictLimiter } from '../middleware/rateLimiter';
import { sendSuccess } from '../utils/response';
import { BadRequestError } from '../utils/errors';

export const contactRoutes = Router();

// ===========================================
// Validation Schemas
// ===========================================

const contactFormSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
  recaptchaToken: z.string().optional(), // For future reCAPTCHA integration
});

const newsletterSchema = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional(),
});

// ===========================================
// Routes
// ===========================================

/**
 * POST /api/contact
 * Submit contact form
 */
contactRoutes.post(
  '/',
  strictLimiter,
  validateBody(contactFormSchema),
  async (req, res, next) => {
    try {
      const { name, email, phone, subject, message } = req.body;

      // TODO: Integrate with email service to send contact form
      // TODO: Optionally store in database for admin review
      // TODO: Integrate reCAPTCHA validation

      // For now, just return success
      // In production, this would send an email

      // Log the contact form submission
      console.log('Contact form submission:', {
        name,
        email,
        phone,
        subject,
        messageLength: message.length,
        timestamp: new Date().toISOString(),
      });

      sendSuccess(res, {
        message: 'Thank you for contacting us. We will get back to you soon.',
        received: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/contact/newsletter
 * Subscribe to newsletter
 */
contactRoutes.post(
  '/newsletter',
  strictLimiter,
  validateBody(newsletterSchema),
  async (req, res, next) => {
    try {
      const { email, name } = req.body;

      // TODO: Integrate with email marketing service (Mailchimp, etc.)
      // TODO: Store in database

      console.log('Newsletter subscription:', {
        email,
        name,
        timestamp: new Date().toISOString(),
      });

      sendSuccess(res, {
        message: 'Successfully subscribed to the newsletter.',
        subscribed: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/contact/quote-request
 * Request a quote
 */
contactRoutes.post(
  '/quote-request',
  strictLimiter,
  validateBody(
    z.object({
      name: z.string().min(1).max(100),
      email: z.string().email(),
      phone: z.string().max(50).optional(),
      company: z.string().max(255).optional(),
      products: z
        .array(
          z.object({
            productId: z.string().uuid(),
            quantity: z.number().int().min(1),
          })
        )
        .min(1),
      message: z.string().max(2000).optional(),
    })
  ),
  async (req, res, next) => {
    try {
      const { name, email, phone, company, products, message } = req.body;

      // TODO: Create quotation in database
      // TODO: Send notification email to admin
      // TODO: Send confirmation email to customer

      console.log('Quote request:', {
        name,
        email,
        phone,
        company,
        productCount: products.length,
        timestamp: new Date().toISOString(),
      });

      sendSuccess(res, {
        message: 'Quote request received. We will contact you shortly with pricing.',
        received: true,
      });
    } catch (error) {
      next(error);
    }
  }
);
