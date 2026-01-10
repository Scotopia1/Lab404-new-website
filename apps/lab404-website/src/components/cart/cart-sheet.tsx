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
import { formatPrice } from '@/lib/format';

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
            <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg h-full">
                <SheetHeader className="px-6">
                    <SheetTitle>Cart ({cart?.itemCount || 0})</SheetTitle>
                </SheetHeader>
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <span className="loading">Loading...</span>
                    </div>
                ) : !cart || cart.items.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center space-y-4 px-6">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                            <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-lg font-semibold">Your cart is empty</p>
                            <p className="text-sm text-muted-foreground">
                                Add some products to get started
                            </p>
                        </div>
                        <SheetTrigger asChild>
                            <Link href="/products" className="w-full max-w-xs">
                                <Button className="w-full min-h-[44px]">
                                    Start Shopping
                                </Button>
                            </Link>
                        </SheetTrigger>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1 pr-6">
                            <div className="flex flex-col divide-y px-6">
                                {cart.items.map((item) => (
                                    <CartItem key={item.id} item={item} />
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="space-y-4 px-6 pt-4 pb-6 border-t bg-background sticky bottom-0">
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">{formatPrice(cart.subtotal, cart.currency)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span className="text-sm">Calculated at checkout</span>
                                </div>
                                <div className="flex justify-between text-base font-semibold pt-2 border-t">
                                    <span>Total</span>
                                    <span>{formatPrice(cart.total, cart.currency)}</span>
                                </div>
                            </div>
                            <SheetTrigger asChild>
                                <Link href="/checkout" className="w-full">
                                    <Button className="w-full min-h-[52px] text-base font-semibold" size="lg">
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