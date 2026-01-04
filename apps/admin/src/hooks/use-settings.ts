import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiResponse } from "@/lib/api-client";
import { toast } from "sonner";

// Settings data structure from API (flat)
export interface SettingsData {
  // Business/Store
  business_name: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  // Currency
  currency: string;
  currency_symbol: string;
  // Tax
  tax_rate: number;
  tax_label: string;
  tax_enabled: boolean;
  // Delivery/Shipping
  delivery_fee: number;
  delivery_enabled: boolean;
  free_delivery_threshold: number;
  delivery_time_min: number;
  delivery_time_max: number;
  // Notifications
  email_notifications: boolean;
  sound_notifications: boolean;
  low_stock_notifications: boolean;
  new_order_notifications: boolean;
  // System
  site_title: string;
  site_description: string;
  maintenance_mode: boolean;
  allow_guest_checkout: boolean;
  max_cart_items: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  adminUserId: string;
  admin?: { email: string; firstName: string; lastName: string };
  details: unknown;
  ipAddress: string | null;
  createdAt: string;
}

/**
 * Fetch all settings - returns flat structure
 */
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SettingsData>>("/settings");
      return res.data.data;
    },
  });
}

/**
 * Fetch a specific setting group (business, tax, delivery, etc.)
 */
export function useSetting(key: string) {
  return useQuery({
    queryKey: ["settings", key],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ key: string; value: unknown }>>(`/settings/${key}`);
      return res.data.data;
    },
    enabled: !!key,
  });
}

/**
 * Update settings - accepts partial flat structure
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<SettingsData>) => {
      const res = await api.put<ApiResponse<{ message: string; updatedGroups: string[] }>>("/settings", updates);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update settings");
    },
  });
}

/**
 * Reset settings to defaults
 */
export function useResetSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groups?: string[]) => {
      const res = await api.post<ApiResponse<{ message: string }>>("/settings/reset", { groups });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings reset to defaults");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reset settings");
    },
  });
}

/**
 * Fetch activity logs with pagination
 */
export function useActivityLogs(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["activity-logs", params],
    queryFn: async () => {
      const res = await api.get<
        ApiResponse<ActivityLog[]> & {
          meta: { page: number; limit: number; total: number; totalPages: number };
        }
      >("/settings/activity-logs", { params });
      return res.data;
    },
  });
}
