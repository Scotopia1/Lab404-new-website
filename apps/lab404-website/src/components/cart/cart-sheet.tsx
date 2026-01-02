'use client';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { CartItem } from './cart-item';
import { ScrollArea } from '@/components/ui/scroll-area'; // Need to install scroll-area
import Link from 'next/link';
import { Separator } from '@/components/ui/separator'; // Need to install separator

export function CartSheet() {
    const { cart, isLoading } = useCart();

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cart?.itemCount ? (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                            {cart.itemCount}
                        </span>
                    ) : null}
                    <span className="sr-only">Cart</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
                <SheetHeader className="px-1">
                    <SheetTitle>Cart ({cart?.itemCount || 0})</SheetTitle>
                </SheetHeader>
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <span className="loading">Loading...</span>
                    </div>
                ) : !cart || cart.items.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center space-y-2">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                        <span className="text-lg font-medium text-muted-foreground">
                            Your cart is empty
                        </span>
                        <SheetTrigger asChild>
                            <Link href="/products">
                                <Button variant="link" size="sm" className="text-sm text-primary">
                                    Start Shopping
                                </Button>
                            </Link>
                        </SheetTrigger>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1 pr-6">
                            <div className="flex flex-col divide-y">
                                {cart.items.map((item) => (
                                    <CartItem key={item.id} item={item} />
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="space-y-4 pr-6 pt-4 pb-4">
                            <Separator />
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>${cart.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span>Calculated at checkout</span>
                                </div>
                                <div className="flex justify-between text-base font-medium">
                                    <span>Total</span>
                                    <span>${cart.total.toFixed(2)}</span>
                                </div>
                            </div>
                            <SheetTrigger asChild>
                                <Link href="/checkout" className="w-full">
                                    <Button className="w-full" size="lg">
                                        Checkout
                                    </Button>
                                </Link>
                            </SheetTrigger>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
