import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiResponse } from "@/lib/api-client";
import { toast } from "sonner";

export interface QuotationItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string | null;
  customer?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted";
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  validUntil: string | null;
  notes: string | null;
  items: QuotationItem[];
  createdAt: string;
  updatedAt: string;
}

export interface QuotationInput {
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  validUntil?: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
}

interface QuotationsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export function useQuotations(params: QuotationsParams = {}) {
  return useQuery({
    queryKey: ["quotations", params],
    queryFn: async () => {
      const res = await api.get<
        ApiResponse<Quotation[]> & {
          meta: { page: number; limit: number; total: number; totalPages: number };
        }
      >("/quotations", { params });
      return res.data;
    },
  });
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: ["quotations", id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Quotation>>(`/quotations/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: QuotationInput) => {
      const res = await api.post<ApiResponse<Quotation>>("/quotations", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create quotation");
    },
  });
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<QuotationInput> }) => {
      const res = await api.put<ApiResponse<Quotation>>(`/quotations/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotations", id] });
      toast.success("Quotation updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update quotation");
    },
  });
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/quotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete quotation");
    },
  });
}

export function useSendQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiResponse<Quotation>>(`/quotations/${id}/send`);
      return res.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotations", id] });
      toast.success("Quotation sent to customer");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send quotation");
    },
  });
}

export function useConvertQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiResponse<{ quotation: Quotation; orderId: string }>>(
        `/quotations/${id}/convert`
      );
      return res.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotations", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Quotation converted to order");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to convert quotation");
    },
  });
}
