import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    imageUrl?: string;
    parentId: string | null;
    children?: Category[];
}

export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await api.get<{ success: boolean; data: Category[] }>('/categories');
            return data.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
