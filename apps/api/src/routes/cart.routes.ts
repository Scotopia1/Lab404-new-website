import { Router } from 'express';
import { z } from 'zod';
import { getDb, carts, cartItems, cartPromoCodes, products, productVariants, eq, and } from '@lab404/database';
import { validateBody } from '../middleware/validator';
import { optionalAuth } from '../middleware/auth';
import { sendSuccess, sendNoContent } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { pricingService } from '../services/pricing.service';
import { v4 as uuidv4 } from 'uuid';

export const cartRoutes = Router();

// Apply optional auth to all cart routes
cartRoutes.use(optionalAuth);

// ===========================================
// Validation Schemas
// ===========================================

const addToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number()
      .int('Quantity must be a whole number')
      .positive('Quantity must be positive')
      .min(1, 'Quantity must be at least 1')
      .max(9999, 'Quantity cannot exceed 9999')
  ),
});

const updateCartItemSchema = z.object({
  quantity: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number()
      .int('Quantity must be a whole number')
      .positive('Quantity must be positive')
      .min(1, 'Quantity must be at least 1')
      .max(9999, 'Quantity cannot exceed 9999')
  ),
});

const applyPromoSchema = z.object({
  code: z.string().min(1).max(50),
});

// ===========================================
// Helper Functions
// ===========================================

async function getOrCreateCart(userId?: string, sessionId?: string): Promise<typeof carts.$inferSelect> {
  const db = getDb();

  // Try to find existing cart
  let cart: typeof carts.$inferSelect | undefined;

  if (userId) {
    const [existing] = await db
      .select()
      .from(carts)
      .where(eq(carts.customerId, userId));
    cart = existing;
  } else if (sessionId) {
    const [existing] = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, sessionId));
    cart = existing;
  }

  // Create new cart if not found
  if (!cart) {
    const newSessionId = sessionId || uuidv4();
    const [created] = await db
      .insert(carts)
      .values({
        customerId: userId,
        sessionId: userId ? undefined : newSessionId,
      })
      .returning();
    if (!created) {
      throw new Error('Failed to create cart');
    }
    cart = created;
  }

  return cart;
}

async function getCartItems(cartId: string) {
  const db = getDb();

  return db
    .select()
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId));
}

// ===========================================
// Routes
// ===========================================

/**
 * GET /api/cart
 * Get current cart
 */
cartRoutes.get('/', async (req, res, next) => {
  try {
    const userId = req.user?.customerId;
    const sessionId = req.sessionId || req.headers['x-session-id'] as string;

    if (!userId && !sessionId) {
      // Return empty cart for anonymous users without session
      return sendSuccess(res, {
        id: null,
        items: [],
        itemCount: 0,
      });
    }

    const cart = await getOrCreateCart(userId, sessionId);
    const items = await getCartItems(cart.id);

    sendSuccess(res, {
      id: cart.id,
      sessionId: cart.sessionId,
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cart/calculate
 * Calculate cart totals (CRITICAL - server-side calculation)
 */
cartRoutes.get('/calculate', async (req, res, next) => {
  try {
    const userId = req.user?.customerId;
    const sessionId = req.sessionId || req.headers['x-session-id'] as string;

    if (!userId && !sessionId) {
      return sendSuccess(res, {
        items: [],
        itemCount: 0,
        subtotal: 0,
        taxRate: 0.11,
        taxAmount: 0,
        shippingAmount: 0,
        discountAmount: 0,
        total: 0,
        currency: 'USD',
      });
    }

    const cart = await getOrCreateCart(userId, sessionId);
    const items = await getCartItems(cart.id);

    if (items.length === 0) {
      return sendSuccess(res, {
        items: [],
        itemCount: 0,
        subtotal: 0,
        taxRate: 0.11,
        taxAmount: 0,
        shippingAmount: 0,
        discountAmount: 0,
        total: 0,
        currency: 'USD',
      });
    }

    // Get promo code if applied
    const db = getDb();
    const [promoCode] = await db
      .select()
      .from(cartPromoCodes)
      .where(eq(cartPromoCodes.cartId, cart.id));

    // Calculate totals using pricing service
    const cartInput = items.map(item => ({
      productId: item.productId,
      variantId: item.variantId || undefined,
      quantity: item.quantity,
    }));

    const calculation = await pricingService.calculateCart(
      cartInput,
      promoCode?.code
    );

    sendSuccess(res, calculation);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cart/items
 * Add item to cart
 */
cartRoutes.post('/items', validateBody(addToCartSchema), async (req, res, next) => {
  try {
    const db = getDb();
    const userId = req.user?.customerId;
    const sessionId = req.sessionId || req.headers['x-session-id'] as string || uuidv4();
    const { productId, variantId, quantity } = req.body;

    // Validate product exists
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product || product.status !== 'active') {
      throw new NotFoundError('Product not found');
    }

    // Validate variant if provided
    if (variantId) {
      const [variant] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, variantId));

      if (!variant || !variant.isActive) {
        throw new NotFoundError('Variant not found');
      }
    }

    const cart = await getOrCreateCart(userId, sessionId);

    // Check if item already in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cart.id),
          eq(cartItems.productId, productId),
          variantId ? eq(cartItems.variantId, variantId) : eq(cartItems.variantId, cartItems.variantId)
        )
      );

    let cartItem;

    if (existingItem) {
      // Update quantity
      [cartItem] = await db
        .update(cartItems)
        .set({
          quantity: existingItem.quantity + quantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
    } else {
      // Add new item
      const [created] = await db
        .insert(cartItems)
        .values({
          cartId: cart.id,
          productId,
          variantId,
          quantity,
        })
        .returning();
      cartItem = created;
    }

    if (!cartItem) {
      throw new Error('Failed to add item to cart');
    }

    sendSuccess(res, {
      id: cartItem.id,
      cartId: cart.id,
      sessionId: cart.sessionId,
      productId: cartItem.productId,
      variantId: cartItem.variantId,
      quantity: cartItem.quantity,
    }, 201);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/cart/items/:id
 * Update cart item quantity
 */
cartRoutes.put('/items/:id', validateBody(updateCartItemSchema), async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;
    const { quantity } = req.body;

    const [cartItem] = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.id, id));

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    const [updated] = await db
      .update(cartItems)
      .set({
        quantity,
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, id))
      .returning();

    sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/cart/items/:id
 * Remove item from cart
 */
cartRoutes.delete('/items/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [cartItem] = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.id, id));

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    await db.delete(cartItems).where(eq(cartItems.id, id));

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cart/apply-promo
 * Apply promo code to cart
 */
cartRoutes.post('/apply-promo', validateBody(applyPromoSchema), async (req, res, next) => {
  try {
    const db = getDb();
    const userId = req.user?.customerId;
    const sessionId = req.sessionId || req.headers['x-session-id'] as string;
    const { code } = req.body;

    if (!userId && !sessionId) {
      throw new BadRequestError('Cart not found');
    }

    const cart = await getOrCreateCart(userId, sessionId);
    const items = await getCartItems(cart.id);

    if (items.length === 0) {
      throw new BadRequestError('Cart is empty');
    }

    // Calculate current subtotal
    const cartInput = items.map(item => ({
      productId: item.productId,
      variantId: item.variantId || undefined,
      quantity: item.quantity,
    }));

    // Validate promo code and check eligibility
    const calculation = await pricingService.calculateCart(cartInput, code);

    // Check if promo code was validated
    if (!calculation.promoCodeId) {
      throw new BadRequestError('Invalid or expired promo code');
    }

    // Check if any items are eligible for this promo code
    // If promo has restrictions but no items match, reject it
    if (calculation.discountAmount === 0 && calculation.promoCode) {
      throw new BadRequestError(
        'This promo code does not apply to any items in your cart. ' +
        'It may only be valid for specific products or categories.'
      );
    }

    // Remove existing promo code
    await db.delete(cartPromoCodes).where(eq(cartPromoCodes.cartId, cart.id));

    // Apply new promo code
    await db.insert(cartPromoCodes).values({
      cartId: cart.id,
      promoCodeId: calculation.promoCodeId,
      code: calculation.promoCode!,
    });

    sendSuccess(res, calculation);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/cart/promo
 * Remove promo code from cart
 */
cartRoutes.delete('/promo', async (req, res, next) => {
  try {
    const db = getDb();
    const userId = req.user?.customerId;
    const sessionId = req.sessionId || req.headers['x-session-id'] as string;

    if (!userId && !sessionId) {
      throw new BadRequestError('Cart not found');
    }

    const cart = await getOrCreateCart(userId, sessionId);

    await db.delete(cartPromoCodes).where(eq(cartPromoCodes.cartId, cart.id));

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});
