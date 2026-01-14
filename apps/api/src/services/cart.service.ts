import { getDb, carts, cartItems, eq, and, isNull } from '@lab404/database';
import { logger } from '../utils/logger';

/**
 * Cart Service
 * Handles cart operations including merging session carts on login
 */
export class CartService {
  /**
   * Merge session cart into customer cart on login
   * Combines quantities for duplicate items (same product + variant)
   *
   * @param sessionId - Session ID from x-session-id header
   * @param customerId - Customer ID from authenticated user
   * @returns Number of items merged
   */
  async mergeSessionCart(sessionId: string, customerId: string): Promise<number> {
    const db = getDb();

    try {
      // Find session cart
      const [sessionCart] = await db
        .select()
        .from(carts)
        .where(eq(carts.sessionId, sessionId));

      if (!sessionCart) {
        logger.debug('No session cart to merge', { sessionId, customerId });
        return 0;
      }

      // Find or create customer cart
      let [customerCart] = await db
        .select()
        .from(carts)
        .where(eq(carts.customerId, customerId));

      if (!customerCart) {
        // Create customer cart
        [customerCart] = await db
          .insert(carts)
          .values({ customerId })
          .returning();

        if (!customerCart) {
          throw new Error('Failed to create customer cart');
        }
      }

      // Get all session cart items
      const sessionItems = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, sessionCart.id));

      if (sessionItems.length === 0) {
        // Empty session cart - just delete it
        await db.delete(carts).where(eq(carts.id, sessionCart.id));
        return 0;
      }

      let mergedCount = 0;

      // Process each session item
      for (const item of sessionItems) {
        // Check if customer cart has same product+variant
        const [existingItem] = await db
          .select()
          .from(cartItems)
          .where(
            and(
              eq(cartItems.cartId, customerCart.id),
              eq(cartItems.productId, item.productId),
              item.variantId
                ? eq(cartItems.variantId, item.variantId)
                : isNull(cartItems.variantId)
            )
          );

        if (existingItem) {
          // Duplicate found - merge quantities
          await db
            .update(cartItems)
            .set({
              quantity: existingItem.quantity + item.quantity,
              updatedAt: new Date(),
            })
            .where(eq(cartItems.id, existingItem.id));

          logger.debug('Merged cart item quantities', {
            productId: item.productId,
            variantId: item.variantId,
            oldQuantity: existingItem.quantity,
            addedQuantity: item.quantity,
            newQuantity: existingItem.quantity + item.quantity,
          });
        } else {
          // New item - transfer to customer cart
          await db
            .update(cartItems)
            .set({
              cartId: customerCart.id,
              updatedAt: new Date(),
            })
            .where(eq(cartItems.id, item.id));

          logger.debug('Transferred cart item to customer', {
            cartItemId: item.id,
            productId: item.productId,
          });
        }

        mergedCount++;
      }

      // Delete session cart (cascade deletes any remaining items)
      await db.delete(carts).where(eq(carts.id, sessionCart.id));

      logger.info('Cart merge completed', {
        sessionId,
        customerId,
        itemsMerged: mergedCount,
      });

      return mergedCount;
    } catch (error) {
      logger.error('Cart merge failed', error, {
        sessionId,
        customerId,
      });
      // Don't throw - merge failure shouldn't block login
      return 0;
    }
  }
}

// Export singleton instance
export const cartService = new CartService();
