import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import type { CartCalculation, CartItem } from '@/types/cart';

// Re-export for convenience
export type { CartItem, CartCalculation };

export function useCart() {
    const queryClient = useQueryClient();

    const cartQuery = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const { data } = await api.get<{ success: boolean; data: CartCalculation }>('/cart/calculate');
            return data.data;
        },
        staleTime: 30000,
        refetchInterval: 30000,
    });

    const addToCart = useMutation({
        mutationFn: async (payload: { productId: string; quantity: number; variantId?: string }) => {
            await api.post('/cart/items', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast({
                title: 'Added to cart',
                description: 'Item has been added to your cart.',
            });
        },
        onError: () => {
            toast({
                title: 'Error',
                description: 'Failed to add item to cart. Please try again.',
                variant: 'destructive',
            });
        },
    });

    const updateQuantity = useMutation({
        mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
            await api.put(`/cart/items/${id}`, { quantity });
        },
        onMutate: async ({ id, quantity }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['cart'] });

            // Snapshot the previous value
            const previousCart = queryClient.getQueryData<CartCalculation>(['cart']);

            // Optimistically update the cart
            if (previousCart) {
                const updatedItems = previousCart.items.map((item) => {
                    if (item.id === id) {
                        const newLineTotal = item.unitPrice * quantity;
                        return { ...item, quantity, lineTotal: newLineTotal };
                    }
                    return item;
                });

                const newSubtotal = updatedItems.reduce((sum, item) => sum + item.lineTotal, 0);
                const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
                const newTaxAmount = newSubtotal * previousCart.taxRate;
                const newTotal = newSubtotal + newTaxAmount + previousCart.shippingAmount - previousCart.discountAmount;

                queryClient.setQueryData<CartCalculation>(['cart'], {
                    ...previousCart,
                    items: updatedItems,
                    itemCount: newItemCount,
                    subtotal: newSubtotal,
                    taxAmount: newTaxAmount,
                    total: newTotal,
                });
            }

            return { previousCart };
        },
        onError: (_err, _variables, context) => {
            // Rollback to previous state on error
            if (context?.previousCart) {
                queryClient.setQueryData(['cart'], context.previousCart);
            }
            toast({
                title: 'Error',
                description: 'Failed to update quantity. Please try again.',
                variant: 'destructive',
            });
        },
        onSettled: () => {
            // Refetch after mutation settles to ensure consistency
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    const removeFromCart = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/cart/items/${id}`);
        },
        onMutate: async (id) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['cart'] });

            // Snapshot the previous value
            const previousCart = queryClient.getQueryData<CartCalculation>(['cart']);

            // Optimistically remove the item
            if (previousCart) {
                const updatedItems = previousCart.items.filter((item) => item.id !== id);
                const newSubtotal = updatedItems.reduce((sum, item) => sum + item.lineTotal, 0);
                const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
                const newTaxAmount = newSubtotal * previousCart.taxRate;
                const newTotal = newSubtotal + newTaxAmount + previousCart.shippingAmount - previousCart.discountAmount;

                queryClient.setQueryData<CartCalculation>(['cart'], {
                    ...previousCart,
                    items: updatedItems,
                    itemCount: newItemCount,
                    subtotal: newSubtotal,
                    taxAmount: newTaxAmount,
                    total: newTotal,
                });
            }

            return { previousCart };
        },
        onError: (_err, _variables, context) => {
            // Rollback to previous state on error
            if (context?.previousCart) {
                queryClient.setQueryData(['cart'], context.previousCart);
            }
            toast({
                title: 'Error',
                description: 'Failed to remove item. Please try again.',
                variant: 'destructive',
            });
        },
        onSuccess: () => {
            toast({
                title: 'Item removed',
                description: 'Item has been removed from your cart.',
            });
        },
        onSettled: () => {
            // Refetch after mutation settles to ensure consistency
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    const clearCart = useMutation({
        mutationFn: async () => {
            const { data } = await api.post<{ success: boolean; data: { success: boolean; itemsRemoved: number } }>('/cart/clear');
            return data.data;
        },
        onMutate: async () => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['cart'] });

            // Snapshot the previous value
            const previousCart = queryClient.getQueryData<CartCalculation>(['cart']);

            // Optimistically clear the cart
            if (previousCart) {
                queryClient.setQueryData<CartCalculation>(['cart'], {
                    ...previousCart,
                    items: [],
                    itemCount: 0,
                    subtotal: 0,
                    taxAmount: 0,
                    discountAmount: 0,
                    promoCode: undefined,
                    promoCodeId: undefined,
                    total: previousCart.shippingAmount,
                });
            }

            return { previousCart };
        },
        onError: (_err, _variables, context) => {
            // Rollback to previous state on error
            if (context?.previousCart) {
                queryClient.setQueryData(['cart'], context.previousCart);
            }
            toast({
                title: 'Error',
                description: 'Failed to clear cart. Please try again.',
                variant: 'destructive',
            });
        },
        onSuccess: () => {
            toast({
                title: 'Cart cleared',
                description: 'All items have been removed from your cart.',
            });
        },
        onSettled: () => {
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
