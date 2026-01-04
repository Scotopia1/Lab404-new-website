import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiResponse } from "@/lib/api-client";
import { toast } from "sonner";

export interface Setting {
  key: string;
  value: unknown;
  type: "string" | "number" | "boolean" | "json";
  description: string | null;
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

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Setting[]>>("/settings");
      return res.data.data;
    },
  });
}

export function useSetting(key: string) {
  return useQuery({
    queryKey: ["settings", key],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Setting>>(`/settings/${key}`);
      return res.data.data;
    },
    enabled: !!key,
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const res = await api.put<ApiResponse<Setting>>(`/settings/${key}`, { value });
      return res.data.data;
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["settings", key] });
      toast.success("Setting updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update setting");
    },
  });
}

export function useBulkUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { settings: Array<{ key: string; value: string }> }) => {
      const res = await api.put<ApiResponse<{ updated: number }>>("/settings", data);
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
