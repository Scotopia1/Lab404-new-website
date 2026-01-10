import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CartCalculation, CartItem } from '@/types/cart';

// Re-export for convenience
export type { CartItem, CartCalculation };

export function useCart() {
    const queryClient = useQueryClient();

    const cartQuery = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            // Use calculate endpoint for full details
            const { data } = await api.get<{ success: boolean; data: CartCalculation }>('/cart/calculate');
            return data.data;
        },
        staleTime: 30000, // Poll every 30s
        refetchInterval: 30000,
    });

    const addToCart = useMutation({
        mutationFn: async (payload: { productId: string; quantity: number; variantId?: string }) => {
            await api.post('/cart/items', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    const updateQuantity = useMutation({
        mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
            await api.put(`/cart/items/${id}`, { quantity });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    const removeFromCart = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/cart/items/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    const clearCart = useMutation({
        mutationFn: async () => {
            const { data } = await api.post<{ success: boolean }>('/cart/clear');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    return {
        cart: cartQuery.data,
        isLoading: cartQuery.isLoading,
        isError: cartQuery.isError,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
    };
}
