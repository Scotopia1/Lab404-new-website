import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiResponse } from "@/lib/api-client";
import { toast } from "sonner";

export interface ProductImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface ProductVideo {
  url: string;
  title?: string;
}

export interface ProductDimensions {
  width?: number;
  height?: number;
  depth?: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  brand: string | null;
  categoryId: string | null;
  category?: { id: string; name: string; slug: string };

  // Pricing
  basePrice: number;
  costPrice: number | null;
  compareAtPrice: number | null;

  // Physical
  weight: number | null;
  dimensions: ProductDimensions | null;

  // Inventory
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  inStock?: boolean;

  // Media
  images: ProductImage[];
  videos: ProductVideo[];
  thumbnailUrl: string | null;

  // Organization
  tags: string[];
  specifications: Record<string, string>;
  features: string[];

  // SEO
  metaTitle: string | null;
  metaDescription: string | null;

  // Status & flags
  status: "draft" | "active" | "archived";
  isFeatured: boolean;
  isDigital: boolean;
  requiresShipping: boolean;

  // Supplier
  supplierId: string | null;
  supplierSku: string | null;

  // Import
  importedFrom: string | null;
  externalUrl: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  // Basic info
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  barcode?: string;
  brand?: string;
  categoryId?: string;

  // Pricing
  basePrice: number;
  costPrice?: number | null;
  compareAtPrice?: number | null;

  // Physical
  weight?: number | null;
  dimensions?: ProductDimensions | null;

  // Inventory
  stockQuantity?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  allowBackorder?: boolean;

  // Media
  images?: ProductImage[];
  videos?: ProductVideo[];
  thumbnailUrl?: string | null;

  // Organization
  tags?: string[];
  specifications?: Record<string, string>;
  features?: string[];

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  // Status & flags
  status?: "draft" | "active" | "archived";
  isFeatured?: boolean;
  isDigital?: boolean;
  requiresShipping?: boolean;

  // Supplier
  supplierId?: string;
  supplierSku?: string;

  // Import
  externalUrl?: string;
}

interface ProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  categoryId?: string;
  status?: string;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useProducts(params: ProductsParams = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const res = await api.get<
        ApiResponse<Product[]> & {
          meta: { page: number; limit: number; total: number; totalPages: number };
        }
      >("/products", { params });
      return res.data;
    },
  });
}

export function useAdminProducts(params: ProductsParams = {}) {
  return useQuery({
    queryKey: ["admin-products", params],
    queryFn: async () => {
      // Admin endpoint that returns all products regardless of status
      const res = await api.get<
        ApiResponse<Product[]> & {
          meta: { page: number; limit: number; total: number; totalPages: number };
        }
      >("/products", { params: { ...params, includeAll: true } });
      return res.data;
    },
  });
}

export function useProduct(idOrSlug: string) {
  return useQuery({
    queryKey: ["products", idOrSlug],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Product>>(`/products/${idOrSlug}`);
      return res.data.data;
    },
    enabled: !!idOrSlug,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProductInput) => {
      const res = await api.post<ApiResponse<Product>>("/products", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products-count"] });
      toast.success("Product created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create product");
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductInput> }) => {
      const res = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products", id] });
      toast.success("Product updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update product");
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products-count"] });
      toast.success("Product deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete product");
    },
  });
}

export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => api.delete(`/products/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products-count"] });
      toast.success("Products deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete products");
    },
  });
}

export function useBulkUpdateProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: Partial<ProductInput> }) => {
      await Promise.all(
        ids.map((id) => api.put(`/products/${id}`, data))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Products updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update products");
    },
  });
}
