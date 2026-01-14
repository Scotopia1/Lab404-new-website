import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiResponse, getErrorMessage } from "@/lib/api-client";
import { toast } from "sonner";

// ===========================================
// Types
// ===========================================

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name: string | null;
  customerId: string | null;
  status: "active" | "unsubscribed" | "bounced";
  source: "footer" | "checkout" | "popup" | "import" | "admin";
  unsubscribeToken: string;
  subscribedAt: string;
  unsubscribedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriberStats {
  total: number;
  active: number;
  unsubscribed: number;
  bounced: number;
  thisMonth: number;
  thisWeek: number;
  bySource: Record<string, number>;
}

export interface NewsletterCampaign {
  id: string;
  name: string;
  subject: string;
  previewText: string | null;
  content: string;
  status: "draft" | "scheduled" | "sending" | "paused" | "completed" | "cancelled";
  dailyLimit: number;
  sendTime: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  openCount: number;
  clickCount: number;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  lastSentAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignInput {
  name: string;
  subject: string;
  previewText?: string;
  content: string;
  dailyLimit?: number;
  sendTime?: string;
  scheduledAt?: string;
}

// ===========================================
// Subscriber Hooks
// ===========================================

interface SubscribersParams {
  page?: number;
  limit?: number;
  status?: string;
  source?: string;
  search?: string;
}

export function useNewsletterSubscribers(params: SubscribersParams = {}) {
  return useQuery({
    queryKey: ["newsletter-subscribers", params],
    queryFn: async () => {
      const res = await api.get<
        ApiResponse<NewsletterSubscriber[]> & {
          meta: { page: number; limit: number; total: number; totalPages: number };
        }
      >("/newsletter/subscribers", { params });
      return res.data;
    },
  });
}

export function useSubscriberStats() {
  return useQuery({
    queryKey: ["newsletter-subscriber-stats"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SubscriberStats>>("/newsletter/subscribers/stats");
      return res.data.data;
    },
    staleTime: 30000,
  });
}

export function useAddSubscriber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; name?: string; source?: string }) => {
      const res = await api.post<ApiResponse<NewsletterSubscriber>>("/newsletter/subscribers", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscriber-stats"] });
      toast.success("Subscriber added successfully");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useImportSubscribers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subscribers: { email: string; name?: string }[]) => {
      const res = await api.post<ApiResponse<{ imported: number; skipped: number }>>("/newsletter/subscribers/import", {
        subscribers,
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscriber-stats"] });
      toast.success(`Imported ${data.imported} subscribers (${data.skipped} skipped)`);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteSubscriber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/newsletter/subscribers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscriber-stats"] });
      toast.success("Subscriber removed");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useBulkDeleteSubscribers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await api.post("/newsletter/subscribers/bulk-delete", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscriber-stats"] });
      toast.success("Subscribers removed");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// ===========================================
// Campaign Hooks
// ===========================================

interface CampaignsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export function useNewsletterCampaigns(params: CampaignsParams = {}) {
  return useQuery({
    queryKey: ["newsletter-campaigns", params],
    queryFn: async () => {
      const res = await api.get<
        ApiResponse<NewsletterCampaign[]> & {
          meta: { page: number; limit: number; total: number; totalPages: number };
        }
      >("/newsletter/campaigns", { params });
      return res.data;
    },
  });
}

export function useNewsletterCampaign(id: string) {
  return useQuery({
    queryKey: ["newsletter-campaigns", id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<NewsletterCampaign>>(`/newsletter/campaigns/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CampaignInput) => {
      const res = await api.post<ApiResponse<NewsletterCampaign>>("/newsletter/campaigns", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
      toast.success("Campaign created");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CampaignInput> }) => {
      const res = await api.put<ApiResponse<NewsletterCampaign>>(`/newsletter/campaigns/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns", id] });
      toast.success("Campaign updated");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/newsletter/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
      toast.success("Campaign deleted");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useStartCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiResponse<{ campaign: NewsletterCampaign; pendingSends: number }>>(
        `/newsletter/campaigns/${id}/start`
      );
      return res.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns", id] });
      toast.success("Campaign started");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function usePauseCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiResponse<{ campaign: NewsletterCampaign }>>(`/newsletter/campaigns/${id}/pause`);
      return res.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns", id] });
      toast.success("Campaign paused");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useCancelCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiResponse<{ campaign: NewsletterCampaign }>>(`/newsletter/campaigns/${id}/cancel`);
      return res.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns", id] });
      toast.success("Campaign cancelled");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: async ({ campaignId, email }: { campaignId: string; email: string }) => {
      const res = await api.post<ApiResponse<{ message: string }>>(`/newsletter/campaigns/${campaignId}/test`, {
        email,
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Test email sent");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
