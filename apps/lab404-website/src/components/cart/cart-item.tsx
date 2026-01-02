'use client';

import { CartItem as ICartItem, useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

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
            <div className="relative h-20 w-20 overflow-hidden rounded-md border bg-muted">
                {item.product.image && (
                    <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                    />
                )}
            </div>
            <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-medium leading-none">
                        {item.product.name}
                    </h3>
                    <p className="text-sm font-bold">${item.product.price}</p>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateQuantity(item.quantity - 1)}
                            disabled={item.quantity <= 1 || isUpdating}
                        >
                            <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-4 text-center text-sm">{item.quantity}</span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateQuantity(item.quantity + 1)}
                            disabled={isUpdating}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
