import { getDb, products, productVariants, promoCodes, settings, eq, inArray } from '@lab404/database';
import type { CartCalculation, DiscountType } from '@lab404/shared-types';
import { round } from '../utils/helpers';
import { BadRequestError } from '../utils/errors';

/**
 * Cart item input for calculation
 */
interface CartItemInput {
  id?: string;        // Cart item database ID (for frontend operations)
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
  appliesToProducts: string[] | null;
  appliesToCategories: string[] | null;
}

/**
 * Internal cart item with category info for promo calculation
 */
interface CartItemWithCategory {
  productId: string;
  categoryId: string | null;
  lineTotal: number;
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
        id: item.id || item.variantId || item.productId,
        productId: item.productId,
        variantId: item.variantId,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          thumbnailUrl: this.getProductImage(product),
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

    // 5. Build category mapping for promo code restrictions
    const itemsWithCategory: CartItemWithCategory[] = calculatedItems.map((item) => {
      const product = productData.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        categoryId: product?.categoryId || null,
        lineTotal: item.lineTotal,
      };
    });

    // 6. Validate and calculate promo code discount
    let discountAmount = 0;
    let eligibleItemIds: string[] = [];
    let promoCodeResult: PromoCodeResult | undefined;

    if (promoCode) {
      promoCodeResult = await this.validatePromoCode(promoCode, subtotal);

      if (promoCodeResult) {
        const discountResult = this.calculateDiscount(promoCodeResult, itemsWithCategory);
        discountAmount = discountResult.discountAmount;
        eligibleItemIds = discountResult.eligibleItemIds;
      }
    }

    // 7. Get tax rate from settings
    const taxRate = await this.getTaxRate();

    // 8. Calculate tax (IMPORTANT: tax applies to discounted amount, not original subtotal)
    // This is standard practice: customers pay tax on what they actually pay
    // Formula: taxAmount = (subtotal - discount) * taxRate
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = round(taxableAmount * taxRate, 2);

    // 9. Calculate shipping (can be extended later)
    const shippingAmount = 0; // Free shipping for now

    // 10. Calculate final total
    // Formula: total = (subtotal - discount) + tax + shipping
    // Simplified: total = taxableAmount + taxAmount + shippingAmount
    const total = round(taxableAmount + taxAmount + shippingAmount, 2);

    // 11. Calculate item count
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
      eligibleItemIds: eligibleItemIds.length > 0 ? eligibleItemIds : undefined,
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
      appliesToProducts: promoCodeData.appliesToProducts || null,
      appliesToCategories: promoCodeData.appliesToCategories || null,
    };
  }

  /**
   * Check if an item is eligible for a promo code based on product/category restrictions
   */
  private isItemEligibleForPromo(
    productId: string,
    categoryId: string | null,
    promoCode: PromoCodeResult
  ): boolean {
    const hasProductRestrictions = promoCode.appliesToProducts && promoCode.appliesToProducts.length > 0;
    const hasCategoryRestrictions = promoCode.appliesToCategories && promoCode.appliesToCategories.length > 0;

    // If no restrictions, all products are eligible
    if (!hasProductRestrictions && !hasCategoryRestrictions) {
      return true;
    }

    // Check product whitelist
    if (hasProductRestrictions && promoCode.appliesToProducts!.includes(productId)) {
      return true;
    }

    // Check category whitelist
    if (hasCategoryRestrictions && categoryId && promoCode.appliesToCategories!.includes(categoryId)) {
      return true;
    }

    return false;
  }

  /**
   * Calculate discount amount from promo code
   * Only applies to eligible items based on product/category restrictions
   */
  private calculateDiscount(
    promoCode: PromoCodeResult,
    items: CartItemWithCategory[]
  ): { discountAmount: number; eligibleItemIds: string[] } {
    // Filter items to only those eligible for this promo code
    const eligibleItems = items.filter((item) =>
      this.isItemEligibleForPromo(item.productId, item.categoryId, promoCode)
    );

    // No eligible items = no discount
    if (eligibleItems.length === 0) {
      return { discountAmount: 0, eligibleItemIds: [] };
    }

    // Calculate eligible subtotal (only eligible items)
    const eligibleSubtotal = round(
      eligibleItems.reduce((sum, item) => sum + item.lineTotal, 0),
      2
    );

    let discount = 0;

    if (promoCode.discountType === 'percentage') {
      discount = eligibleSubtotal * (promoCode.discountValue / 100);
    } else {
      // Fixed amount - cap at eligible subtotal
      discount = Math.min(promoCode.discountValue, eligibleSubtotal);
    }

    // Apply maximum discount cap
    if (promoCode.maximumDiscountAmount) {
      discount = Math.min(discount, promoCode.maximumDiscountAmount);
    }

    // Discount cannot exceed eligible subtotal
    discount = Math.min(discount, eligibleSubtotal);

    return {
      discountAmount: round(discount, 2),
      eligibleItemIds: eligibleItems.map((item) => item.productId),
    };
  }

  /**
   * Get current tax rate from settings
   *
   * Tax settings are stored in the database with key 'tax':
   * {
   *   tax_enabled: boolean,
   *   tax_rate: number,     // Percentage (0-100)
   *   tax_label: string     // Display label (e.g., "VAT", "Sales Tax")
   * }
   *
   * Configure tax via:
   * - Admin Dashboard → Settings → Tax
   * - API: PUT /api/settings with tax object
   *
   * Fallback behavior: If no tax setting exists in database, returns 0 (no tax applied).
   * This is a safe default that prevents unexpected charges. Admins must explicitly
   * enable and configure tax rates.
   */
  private async getTaxRate(): Promise<number> {
    const [taxSetting] = await this.db
      .select()
      .from(settings)
      .where(eq(settings.key, 'tax'));

    if (taxSetting && taxSetting.value && typeof taxSetting.value === 'object') {
      const taxValue = taxSetting.value as { tax_rate?: number; tax_enabled?: boolean };

      // Only apply tax if tax_enabled is true
      if (taxValue.tax_enabled && typeof taxValue.tax_rate === 'number') {
        // Tax rate is stored as percentage (0-100), convert to decimal (0-1)
        return taxValue.tax_rate / 100;
      }

      // If tax is disabled, return 0
      if (taxValue.tax_enabled === false) {
        return 0;
      }
    }

    // No tax setting found in database - return 0 (no tax)
    // Admins must configure tax via settings API or admin dashboard
    logger.warn('Tax setting not found in database, applying 0% tax rate');
    return 0;
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

  /**
   * Get product image with fallback priority:
   * 1. thumbnailUrl
   * 2. First image from images array
   * 3. undefined (no image)
   */
  private getProductImage(product: typeof products.$inferSelect): string | undefined {
    if (product.thumbnailUrl) {
      return product.thumbnailUrl;
    }

    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];
      if (firstImage && typeof firstImage === 'object' && 'url' in firstImage) {
        return firstImage.url;
      }
    }

    return undefined;
  }
}

// Export singleton instance
export const pricingService = new PricingService();
