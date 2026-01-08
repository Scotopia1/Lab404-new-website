import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImageUrl?: string;
  tags?: string[];
  status: 'draft' | 'published';
  publishedAt: Date | null;
  createdAt: Date;
  metaTitle?: string;
  metaDescription?: string;
}

interface BlogsResponse {
  success: boolean;
  data: Blog[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UseBlogsParams {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
}

export function useBlogs(params: UseBlogsParams = {}) {
  return useQuery({
    queryKey: ['blogs', params],
    queryFn: async () => {
      const { data } = await api.get<BlogsResponse>('/blogs', { params });
      return data;
    },
  });
}

export function useBlog(slug: string) {
  return useQuery({
    queryKey: ['blog', slug],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Blog }>(`/blogs/${slug}`);
      return data.data;
    },
    enabled: !!slug,
  });
}
