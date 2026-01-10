'use client';

import type { CartItem as ICartItem } from '@/types/cart';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/format';

interface CartItemProps {
    item: ICartItem;
}

export function CartItem({ item }: CartItemProps) {
    const { updateQuantity, removeFromCart } = useCart();
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdateQuantity = async (newQuantity: number) => {
        if (newQuantity < 1) return;
        setIsUpdating(true);
        try {
            await updateQuantity.mutateAsync({ id: item.id, quantity: newQuantity });
        } catch (error) {
            toast.error('Failed to update quantity');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemove = async () => {
        setIsUpdating(true);
        try {
            await removeFromCart.mutateAsync(item.id);
            toast.success('Item removed from cart');
        } catch (error) {
            toast.error('Failed to remove item');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="flex gap-4 py-4">
            <div className="relative h-24 w-24 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-md border bg-muted">
                {item.product.thumbnailUrl ? (
                    <Image
                        src={item.product.thumbnailUrl}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                        <span className="text-xs text-muted-foreground">No image</span>
                    </div>
                )}
            </div>
            <div className="flex flex-1 flex-col justify-between gap-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start sm:gap-2">
                    <h3 className="line-clamp-2 text-sm font-medium leading-snug">
                        {item.product.name}
                    </h3>
                    <div className="flex flex-col items-start sm:items-end gap-0.5 shrink-0">
                        <p className="text-xs text-muted-foreground">
                            {formatPrice(item.unitPrice)} each
                        </p>
                        <p className="text-sm font-bold">
                            {formatPrice(item.lineTotal)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 shrink-0"
                            onClick={() => handleUpdateQuantity(item.quantity - 1)}
                            disabled={item.quantity <= 1 || isUpdating}
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center text-base font-medium">{item.quantity}</span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 shrink-0"
                            onClick={() => handleUpdateQuantity(item.quantity + 1)}
                            disabled={isUpdating}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={handleRemove}
                        disabled={isUpdating}
                    >
                        {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}