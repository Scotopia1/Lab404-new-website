import { useQuery } from "@tanstack/react-query";
import { api, ApiResponse } from "@/lib/api-client";

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  options: Record<string, string>;
  basePrice: number;
  stockQuantity: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useProductVariants(productId: string | null) {
  return useQuery({
    queryKey: ["product-variants", productId],
    queryFn: async () => {
      if (!productId) return [];
      const res = await api.get<ApiResponse<ProductVariant[]>>(
        `/products/${productId}/variants`
      );
      return res.data.data;
    },
    enabled: !!productId,
  });
}

// Helper to format variant options as a readable string
export function formatVariantOptions(options: Record<string, string>): string {
  return Object.entries(options)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}
