import { Router } from 'express';
import { z } from 'zod';
import { notificationService, NotificationType } from '../services/notification.service';
import { mailerService } from '../services/mailer.service';
import { validateBody } from '../middleware/validator';
import { sendSuccess, sendError } from '../utils/response';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Schema for updating notification settings
const updateSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  adminEmails: z.array(z.string().email()).optional(),
  notifications: z.object({
    new_order: z.boolean().optional(),
    order_status_change: z.boolean().optional(),
    low_stock_alert: z.boolean().optional(),
    new_customer: z.boolean().optional(),
    new_contact_message: z.boolean().optional(),
    quotation_request: z.boolean().optional(),
    payment_received: z.boolean().optional(),
    refund_processed: z.boolean().optional(),
  }).optional(),
});

// Schema for sending test notification
const testNotificationSchema = z.object({
  type: z.enum([
    'new_order',
    'order_status_change',
    'low_stock_alert',
    'new_customer',
    'new_contact_message',
    'quotation_request',
    'payment_received',
    'refund_processed',
  ]),
  email: z.string().email().optional(),
});

/**
 * @route GET /api/notifications/settings
 * @desc Get notification settings
 * @access Admin
 */
router.get('/settings', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const settings = notificationService.getSettings();
    const smtpConfigured = mailerService.isReady();

    sendSuccess(res, {
      ...settings,
      smtpConfigured,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/notifications/settings
 * @desc Update notification settings
 * @access Admin
 */
router.put(
  '/settings',
  requireAuth,
  requireAdmin,
  validateBody(updateSettingsSchema),
  async (req, res, next) => {
    try {
      const updates = req.body;
      notificationService.updateSettings(updates);

      sendSuccess(res, {
        message: 'Notification settings updated successfully',
        settings: notificationService.getSettings(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/notifications/test
 * @desc Send a test notification
 * @access Admin
 */
router.post(
  '/test',
  requireAuth,
  requireAdmin,
  validateBody(testNotificationSchema),
  async (req, res, next) => {
    try {
      const { type, email } = req.body;

      if (!mailerService.isReady()) {
        return sendError(res, 400, 'SMTP_NOT_CONFIGURED', 'SMTP not configured. Please configure SMTP settings first.');
      }

      // Test data for different notification types
      const testData: Record<NotificationType, Record<string, string | number>> = {
        new_order: {
          orderId: 'TEST-001',
          customerName: 'Test Customer',
          customerEmail: 'test@example.com',
          total: '299.99',
          itemCount: 3,
        },
        order_status_change: {
          orderId: 'TEST-001',
          previousStatus: 'pending',
          newStatus: 'processing',
        },
        low_stock_alert: {
          productId: 'prod_123',
          productName: 'Arduino Uno R3',
          sku: 'ARD-UNO-R3',
          currentStock: 5,
          threshold: 10,
        },
        new_customer: {
          customerId: 'cust_123',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
        },
        new_contact_message: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          subject: 'Product Inquiry',
          message: 'I would like to know more about your Arduino kits.',
        },
        quotation_request: {
          quotationId: 'QT-001',
          customerName: 'Acme Corp',
          customerEmail: 'purchasing@acme.com',
          itemCount: 5,
        },
        payment_received: {
          orderId: 'ORD-001',
          amount: '499.99',
          paymentMethod: 'Credit Card',
          transactionId: 'txn_abc123',
        },
        refund_processed: {
          orderId: 'ORD-001',
          amount: '99.99',
          reason: 'Customer requested cancellation',
        },
      };

      // Temporarily override admin emails if a test email is provided
      const originalSettings = notificationService.getSettings();
      if (email) {
        notificationService.updateSettings({ adminEmails: [email] });
      }

      const success = await notificationService.notify(type as NotificationType, testData[type as NotificationType]);

      // Restore original settings
      if (email) {
        notificationService.updateSettings({ adminEmails: originalSettings.adminEmails });
      }

      if (success) {
        sendSuccess(res, {
          message: `Test ${type} notification sent successfully`,
          sentTo: email || originalSettings.adminEmails,
        });
      } else {
        sendError(res, 500, 'NOTIFICATION_FAILED', 'Failed to send test notification');
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/notifications/verify-smtp
 * @desc Verify SMTP connection
 * @access Admin
 */
router.post('/verify-smtp', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const isConnected = await mailerService.verifyConnection();

    if (isConnected) {
      sendSuccess(res, {
        message: 'SMTP connection verified successfully',
        connected: true,
      });
    } else {
      sendError(res, 400, 'SMTP_CONNECTION_FAILED', 'SMTP connection failed. Please check your settings.');
    }
  } catch (error) {
    next(error);
  }
});

export default router;
