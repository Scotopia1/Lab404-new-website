import { getDb, products, productVariants, promoCodes, settings, eq, inArray } from '@lab404/database';
import type { CartCalculation, DiscountType } from '@lab404/shared-types';
import { round } from '../utils/helpers';
import { BadRequestError } from '../utils/errors';

/**
 * Cart item input for calculation
 */
interface CartItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

/**
 * Promo code validation result
 */
interface PromoCodeResult {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
}

/**
 * CRITICAL: Pricing Service
 *
 * This service handles ALL price calculations.
 * NEVER calculate prices on the client side.
 * NEVER trust price values from client requests.
 *
 * All calculations are done using:
 * 1. Current product prices from database
 * 2. Tax rate from settings
 * 3. Validated promo codes
 */
export class PricingService {
  private db = getDb();

  /**
   * Calculate cart totals
   * This is the main method for cart calculation
   *
   * @param items - Cart items with product/variant IDs and quantities
   * @param promoCode - Optional promo code to apply
   * @returns Complete cart calculation with all totals
   */
  async calculateCart(
    items: CartItemInput[],
    promoCode?: string
  ): Promise<CartCalculation> {
    if (items.length === 0) {
      return this.emptyCartCalculation();
    }

    // 1. Fetch current product prices from database
    const productIds = items.map((item) => item.productId);
    const productData = await this.db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    // 2. Fetch variant prices if any variants are specified
    const variantIds = items
      .filter((item) => item.variantId)
      .map((item) => item.variantId as string);

    let variantData: Array<typeof productVariants.$inferSelect> = [];
    if (variantIds.length > 0) {
      variantData = await this.db
        .select()
        .from(productVariants)
        .where(inArray(productVariants.id, variantIds));
    }

    // 3. Build cart items with current prices
    const calculatedItems = items.map((item) => {
      const product = productData.find((p) => p.id === item.productId);

      if (!product) {
        throw new BadRequestError(`Product not found: ${item.productId}`);
      }

      if (product.status !== 'active') {
        throw new BadRequestError(`Product is not available: ${product.name}`);
      }

      let unitPrice = Number(product.basePrice);
      let variant;

      // If variant is specified, use variant price
      if (item.variantId) {
        variant = variantData.find((v) => v.id === item.variantId);

        if (!variant) {
          throw new BadRequestError(`Variant not found: ${item.variantId}`);
        }

        if (!variant.isActive) {
          throw new BadRequestError(`Variant is not available: ${variant.name}`);
        }

        unitPrice = Number(variant.basePrice);
      }

      // Check stock
      const stockQuantity = variant?.stockQuantity ?? product.stockQuantity;
      const inStock = stockQuantity > 0 || product.allowBackorder;

      if (!inStock) {
        throw new BadRequestError(`Product is out of stock: ${product.name}`);
      }

      if (item.quantity > stockQuantity && !product.allowBackorder) {
        throw new BadRequestError(
          `Not enough stock for ${product.name}. Available: ${stockQuantity}`
        );
      }

      const lineTotal = round(unitPrice * item.quantity, 2);

      return {
        id: item.variantId || item.productId,
        productId: item.productId,
        variantId: item.variantId,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          thumbnailUrl: product.thumbnailUrl || undefined,
          basePrice: unitPrice,
          stockQuantity,
          inStock,
        },
        variant: variant
          ? {
              id: variant.id,
              name: variant.name,
              sku: variant.sku,
              options: variant.options as Record<string, string>,
              basePrice: Number(variant.basePrice),
            }
          : undefined,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      };
    });

    // 4. Calculate subtotal from database prices
    const subtotal = round(
      calculatedItems.reduce((sum, item) => sum + item.lineTotal, 0),
      2
    );

    // 5. Validate and calculate promo code discount
    let discountAmount = 0;
    let promoCodeResult: PromoCodeResult | undefined;

    if (promoCode) {
      promoCodeResult = await this.validatePromoCode(promoCode, subtotal);

      if (promoCodeResult) {
        discountAmount = this.calculateDiscount(
          promoCodeResult,
          subtotal,
          calculatedItems
        );
      }
    }

    // 6. Get tax rate from settings
    const taxRate = await this.getTaxRate();

    // 7. Calculate tax (after discount)
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = round(taxableAmount * taxRate, 2);

    // 8. Calculate shipping (can be extended later)
    const shippingAmount = 0; // Free shipping for now

    // 9. Calculate total
    const total = round(taxableAmount + taxAmount + shippingAmount, 2);

    // 10. Calculate item count
    const itemCount = calculatedItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items: calculatedItems,
      itemCount,
      subtotal,
      taxRate,
      taxAmount,
      shippingAmount,
      discountAmount,
      promoCode: promoCodeResult?.code,
      promoCodeId: promoCodeResult?.id,
      total,
      currency: 'USD',
    };
  }

  /**
   * Calculate order totals for checkout
   * Similar to calculateCart but creates snapshots for order creation
   */
  async calculateOrderTotals(
    items: CartItemInput[],
    promoCode?: string
  ): Promise<{
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    shippingAmount: number;
    discountAmount: number;
    total: number;
    promoCodeId?: string;
    promoCodeSnapshot?: string;
  }> {
    const cartCalc = await this.calculateCart(items, promoCode);

    return {
      subtotal: cartCalc.subtotal,
      taxRate: cartCalc.taxRate,
      taxAmount: cartCalc.taxAmount,
      shippingAmount: cartCalc.shippingAmount,
      discountAmount: cartCalc.discountAmount,
      total: cartCalc.total,
      promoCodeId: cartCalc.promoCodeId,
      promoCodeSnapshot: cartCalc.promoCode,
    };
  }

  /**
   * Validate a promo code
   */
  async validatePromoCode(
    code: string,
    subtotal: number
  ): Promise<PromoCodeResult | undefined> {
    const [promoCodeData] = await this.db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.code, code.toUpperCase()));

    if (!promoCodeData) {
      return undefined;
    }

    // Check if active
    if (!promoCodeData.isActive) {
      return undefined;
    }

    // Check dates
    const now = new Date();

    if (promoCodeData.startsAt && new Date(promoCodeData.startsAt) > now) {
      return undefined;
    }

    if (promoCodeData.expiresAt && new Date(promoCodeData.expiresAt) < now) {
      return undefined;
    }

    // Check usage limit
    if (
      promoCodeData.usageLimit !== null &&
      promoCodeData.usageCount >= promoCodeData.usageLimit
    ) {
      return undefined;
    }

    // Check minimum order amount
    if (
      promoCodeData.minimumOrderAmount !== null &&
      subtotal < Number(promoCodeData.minimumOrderAmount)
    ) {
      return undefined;
    }

    return {
      id: promoCodeData.id,
      code: promoCodeData.code,
      discountType: promoCodeData.discountType,
      discountValue: Number(promoCodeData.discountValue),
      minimumOrderAmount: promoCodeData.minimumOrderAmount
        ? Number(promoCodeData.minimumOrderAmount)
        : undefined,
      maximumDiscountAmount: promoCodeData.maximumDiscountAmount
        ? Number(promoCodeData.maximumDiscountAmount)
        : undefined,
    };
  }

  /**
   * Calculate discount amount from promo code
   */
  private calculateDiscount(
    promoCode: PromoCodeResult,
    subtotal: number,
    _items: CartCalculation['items']
  ): number {
    let discount = 0;

    if (promoCode.discountType === 'percentage') {
      discount = subtotal * (promoCode.discountValue / 100);
    } else {
      discount = promoCode.discountValue;
    }

    // Apply maximum discount cap
    if (promoCode.maximumDiscountAmount) {
      discount = Math.min(discount, promoCode.maximumDiscountAmount);
    }

    // Discount cannot exceed subtotal
    discount = Math.min(discount, subtotal);

    return round(discount, 2);
  }

  /**
   * Get current tax rate from settings
   */
  private async getTaxRate(): Promise<number> {
    const [taxSetting] = await this.db
      .select()
      .from(settings)
      .where(eq(settings.key, 'taxRate'));

    if (taxSetting && typeof taxSetting.value === 'number') {
      return taxSetting.value;
    }

    // Default tax rate
    return 0.11;
  }

  /**
   * Return empty cart calculation
   */
  private emptyCartCalculation(): CartCalculation {
    return {
      items: [],
      itemCount: 0,
      subtotal: 0,
      taxRate: 0.11,
      taxAmount: 0,
      shippingAmount: 0,
      discountAmount: 0,
      total: 0,
      currency: 'USD',
    };
  }
}

// Export singleton instance
export const pricingService = new PricingService();
