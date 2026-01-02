import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiResponse } from "@/lib/api-client";
import { toast } from "sonner";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  image: string | null;
  sortOrder: number;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  image?: string;
  sortOrder?: number;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Category[]>>("/categories");
      return res.data.data;
    },
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ["categories", id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Category>>(`/categories/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CategoryInput) => {
      const res = await api.post<ApiResponse<Category>>("/categories", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create category");
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryInput> }) => {
      const res = await api.put<ApiResponse<Category>>(`/categories/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories", id] });
      toast.success("Category updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update category");
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete category");
    },
  });
}
