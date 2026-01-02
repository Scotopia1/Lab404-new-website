import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiResponse } from "@/lib/api-client";
import { toast } from "sonner";

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minimumOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromoCodeInput {
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minimumOrderAmount?: number;
  maxUses?: number;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
}

export function usePromoCodes() {
  return useQuery({
    queryKey: ["promo-codes"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PromoCode[]>>("/promo-codes");
      return res.data.data;
    },
  });
}

export function usePromoCode(id: string) {
  return useQuery({
    queryKey: ["promo-codes", id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PromoCode>>(`/promo-codes/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreatePromoCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PromoCodeInput) => {
      const res = await api.post<ApiResponse<PromoCode>>("/promo-codes", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      toast.success("Promo code created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create promo code");
    },
  });
}

export function useUpdatePromoCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PromoCodeInput> }) => {
      const res = await api.put<ApiResponse<PromoCode>>(`/promo-codes/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      queryClient.invalidateQueries({ queryKey: ["promo-codes", id] });
      toast.success("Promo code updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update promo code");
    },
  });
}

export function useDeletePromoCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/promo-codes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      toast.success("Promo code deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete promo code");
    },
  });
}
