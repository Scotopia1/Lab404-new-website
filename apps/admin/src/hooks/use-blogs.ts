import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiResponse } from "@/lib/api-client";
import { toast } from "sonner";

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImageUrl: string | null;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  authorId: string | null;
  authorName: string | null;
  tags: string[] | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  featuredImageUrl?: string;
  status?: "draft" | "published";
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

interface BlogsParams {
  page?: number;
  limit?: number;
  status?: "draft" | "published";
  search?: string;
}

export function useBlogs(params: BlogsParams = {}) {
  return useQuery({
    queryKey: ["blogs", params],
    queryFn: async () => {
      const res = await api.get<
        ApiResponse<Blog[]> & {
          meta: { page: number; limit: number; total: number; totalPages: number };
        }
      >("/blogs/admin/all", { params });
      return res.data;
    },
  });
}

export function useBlog(id: string) {
  return useQuery({
    queryKey: ["blogs", id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Blog>>(`/blogs/admin/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BlogInput) => {
      const res = await api.post<ApiResponse<Blog>>("/blogs", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog post created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create blog post");
    },
  });
}

export function useUpdateBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BlogInput> }) => {
      const res = await api.put<ApiResponse<Blog>>(`/blogs/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blogs", id] });
      toast.success("Blog post updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update blog post");
    },
  });
}

export function useDeleteBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/blogs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog post deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete blog post");
    },
  });
}

export function usePublishBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiResponse<Blog>>(`/blogs/${id}/publish`);
      return res.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blogs", id] });
      toast.success("Blog post published");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to publish blog post");
    },
  });
}

export function useUnpublishBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiResponse<Blog>>(`/blogs/${id}/unpublish`);
      return res.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blogs", id] });
      toast.success("Blog post unpublished");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to unpublish blog post");
    },
  });
}
