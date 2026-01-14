import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiResponse, getErrorMessage } from "@/lib/api-client";
import { toast } from "sonner";

export interface QuotationItem {
  id: string;
  productId: string;
  variantId?: string | null;
  name: string;
  sku: string | null;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CustomerAddress {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string | null;

  // Customer fields
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerCompany: string | null;
  customerAddress: CustomerAddress | null;

  // Linked customer (if exists)
  customer?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };

  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted";

  // Pricing
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType?: "percentage" | "fixed" | null;
  discountValue?: number;
  discountAmount: number;
  total: number;
  currency: string;

  validUntil: string | null;
  notes: string | null;
  termsAndConditions: string | null;

  items: QuotationItem[];

  convertedToOrderId?: string | null;
  pdfUrl?: string | null;

  createdAt: string;
  updatedAt: string;

  // Computed field from backend
  isExpired?: boolean;
}

// Item can be either product-based or custom
interface ProductItem {
  productId: string;
  variantId?: string;
  quantity: number;
  customPrice?: number;
}

interface CustomItem {
  name: string;
  description?: string;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
}

export interface QuotationInput {
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  validDays?: number;
  notes?: string;
  terms?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  items: (ProductItem | CustomItem)[];
}

export interface QuotationUpdateInput {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  status?: "draft" | "sent" | "accepted" | "rejected" | "expired";
  notes?: string;
  terms?: string;
  validDays?: number;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  taxRate?: number;
  items?: (ProductItem | CustomItem)[];
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
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: QuotationUpdateInput }) => {
      const res = await api.put<ApiResponse<Quotation>>(`/quotations/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotations", id] });
      toast.success("Quotation updated successfully");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
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
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
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
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useConvertQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiResponse<{ quotation: Quotation; orderId: string }>>(
        `/quotations/${id}/convert-to-order`
      );
      return res.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotations", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Quotation converted to order");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export interface DuplicateQuotationResult {
  id: string;
  quotationNumber: string;
  status: string;
  total: number;
  validUntil: string | null;
  duplicatedFrom: string;
}

export function useDuplicateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiResponse<DuplicateQuotationResult>>(
        `/quotations/${id}/duplicate`
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation duplicated successfully");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Stats Types
export interface QuotationStats {
  total: number;
  byStatus: {
    draft: number;
    sent: number;
    accepted: number;
    rejected: number;
    expired: number;
    converted: number;
  };
  totalValue: number;
  acceptedValue: number;
  conversionRate: number;
  expiringSoon: number;
  thisMonth: number;
}

export function useQuotationStats() {
  return useQuery({
    queryKey: ["quotation-stats"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<QuotationStats>>("/quotations/stats");
      return res.data.data;
    },
    staleTime: 30000, // Cache for 30 seconds
  });
}

// Activity Types
export interface QuotationActivity {
  id: string;
  quotationId: string;
  activityType: string;
  description: string;
  actorType: "system" | "admin" | "customer";
  actorId: string | null;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export function useQuotationActivities(quotationId: string) {
  return useQuery({
    queryKey: ["quotation-activities", quotationId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<QuotationActivity[]>>(
        `/quotations/${quotationId}/activities`
      );
      return res.data.data;
    },
    enabled: !!quotationId,
  });
}

// Bulk Actions Types
export type BulkAction = "delete" | "send" | "changeStatus";

export interface BulkActionInput {
  action: BulkAction;
  ids: string[];
  status?: "draft" | "sent" | "accepted" | "rejected" | "expired";
}

export interface BulkActionResult {
  action: string;
  results: {
    success: string[];
    failed: string[];
  };
  message: string;
}

export function useBulkQuotationAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkActionInput) => {
      const res = await api.post<ApiResponse<BulkActionResult>>(
        "/quotations/bulk",
        data
      );
      return res.data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation-stats"] });

      const { success, failed } = result.results;
      if (failed.length === 0) {
        toast.success(`${success.length} quotation(s) processed successfully`);
      } else if (success.length === 0) {
        toast.error(`All ${failed.length} quotation(s) failed to process`);
      } else {
        toast.warning(
          `${success.length} succeeded, ${failed.length} failed`
        );
      }
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Revision Types
export interface RevisionSnapshot {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerCompany?: string | null;
  status: string;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discountType?: string | null;
  discountValue?: number;
  discountAmount: number;
  total: number;
  validUntil?: string | null;
  notes?: string | null;
  termsAndConditions?: string | null;
  items: Array<{
    productId?: string | null;
    variantId?: string | null;
    name: string;
    description?: string | null;
    sku?: string | null;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface QuotationRevision {
  id: string;
  quotationId: string;
  versionNumber: number;
  snapshot: RevisionSnapshot;
  changeDescription: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
}

export function useQuotationRevisions(quotationId: string) {
  return useQuery({
    queryKey: ["quotation-revisions", quotationId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<QuotationRevision[]>>(
        `/quotations/${quotationId}/revisions`
      );
      return res.data.data;
    },
    enabled: !!quotationId,
  });
}

export function useRestoreQuotationRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      quotationId,
      revisionId,
    }: {
      quotationId: string;
      revisionId: string;
    }) => {
      const res = await api.post<ApiResponse<{ message: string }>>(
        `/quotations/${quotationId}/revisions/${revisionId}/restore`
      );
      return res.data.data;
    },
    onSuccess: (_, { quotationId }) => {
      queryClient.invalidateQueries({ queryKey: ["quotations", quotationId] });
      queryClient.invalidateQueries({ queryKey: ["quotation-revisions", quotationId] });
      toast.success("Quotation restored from revision");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Check and update expired quotations
export interface CheckExpiredResult {
  updated: number;
  quotations?: string[];
  message: string;
}

export function useCheckExpiredQuotations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<CheckExpiredResult>>(
        "/quotations/check-expired"
      );
      return res.data.data;
    },
    onSuccess: (result) => {
      if (result.updated > 0) {
        queryClient.invalidateQueries({ queryKey: ["quotations"] });
        queryClient.invalidateQueries({ queryKey: ["quotation-stats"] });
        toast.info(`${result.updated} quotation(s) marked as expired`);
      }
    },
    onError: () => {
      // Silent failure - don't show error to user for background check
    },
  });
}
