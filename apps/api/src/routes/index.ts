import { Router } from 'express';

// Import route modules
import { authRoutes } from './auth.routes';
import { sessionsRoutes } from './sessions.routes';
import { productsRoutes } from './products.routes';
import { categoriesRoutes } from './categories.routes';
import { cartRoutes } from './cart.routes';
import { ordersRoutes } from './orders.routes';
import { customersRoutes } from './customers.routes';
import { promoCodesRoutes } from './promoCodes.routes';
import { quotationsRoutes } from './quotations.routes';
import { quotationTemplatesRoutes } from './quotation-templates.routes';
import { blogsRoutes } from './blogs.routes';
import { settingsRoutes } from './settings.routes';
import { analyticsRoutes } from './analytics.routes';
import { exportRoutes } from './export.routes';
import { importRoutes } from './import.routes';
import { contactRoutes } from './contact.routes';
import { uploadRoutes } from './upload.routes';
import { healthRoutes } from './health.routes';
import notificationsRoutes from './notifications.routes';
import { searchRoutes } from './search.routes';
import { googleImagesRoutes } from './google-images.routes';
import { pdfTemplatesRoutes } from './pdfTemplates.routes';
import { cronRoutes } from './cron.routes';
import { adminRoutes } from './admin.routes';
import { newsletterRoutes } from './newsletter.routes';

export const router = Router();

// Health check routes (no /api prefix needed, handled at app level too)
router.use('/health', healthRoutes);

// ===========================================
// Public Routes
// ===========================================

// Authentication
router.use('/auth', authRoutes);

// Session Management (authenticated only)
router.use('/auth/sessions', sessionsRoutes);

// Products (public read, admin write)
router.use('/products', productsRoutes);

// Search (public search, admin sync)
router.use('/search', searchRoutes);

// Categories (public read, admin write)
router.use('/categories', categoriesRoutes);

// Cart
router.use('/cart', cartRoutes);

// Orders (public create, auth for user orders, admin for all)
router.use('/orders', ordersRoutes);

// Blogs (public read, admin write)
router.use('/blogs', blogsRoutes);

// Settings (public read for public settings, admin for all)
router.use('/settings', settingsRoutes);

// Promo Codes (public validate, admin CRUD)
router.use('/promo-codes', promoCodesRoutes);

// Contact form (public)
router.use('/contact', contactRoutes);

// ===========================================
// Authenticated Routes
// ===========================================

// Customers (profile management, admin CRUD)
router.use('/customers', customersRoutes);

// ===========================================
// Admin Routes
// ===========================================

// Quotations (Admin only)
router.use('/quotations', quotationsRoutes);

// Quotation Templates (Admin only)
router.use('/quotation-templates', quotationTemplatesRoutes);

// Analytics (Admin only)
router.use('/analytics', analyticsRoutes);

// Export (Admin only)
router.use('/export', exportRoutes);

// Import (Admin only)
router.use('/import', importRoutes);

// Upload / Media (Admin only)
router.use('/upload', uploadRoutes);

// Notifications (Admin only)
router.use('/notifications', notificationsRoutes);

// Google Images (Admin only)
router.use('/google-images', googleImagesRoutes);

// PDF Templates (Admin only)
router.use('/pdf-templates', pdfTemplatesRoutes);

// Admin (Admin only)
router.use('/admin', adminRoutes);

// Newsletter (Admin only)
router.use('/newsletter', newsletterRoutes);

// Cron Jobs (Protected by secret)
router.use('/cron', cronRoutes);

// ===========================================
// API Info
// ===========================================

router.get('/', (_req, res) => {
  res.json({
    name: 'Lab404Electronics API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      // Public
      auth: '/api/auth',
      products: '/api/products',
      search: '/api/search',
      categories: '/api/categories',
      cart: '/api/cart',
      orders: '/api/orders',
      blogs: '/api/blogs',
      contact: '/api/contact',
      health: '/api/health',
      // Authenticated
      customers: '/api/customers',
      // Admin
      promoCodes: '/api/promo-codes',
      quotations: '/api/quotations',
      settings: '/api/settings',
      analytics: '/api/analytics',
      export: '/api/export',
      import: '/api/import',
      upload: '/api/upload',
      notifications: '/api/notifications',
      googleImages: '/api/google-images',
      newsletter: '/api/newsletter',
    },
  });
});
