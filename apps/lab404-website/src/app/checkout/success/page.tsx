'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Order Success Content Component
 *
 * Displays confirmation after successful COD order placement.
 * Shows order number and next steps for COD payment.
 */
function CheckoutSuccessContent() {
    const searchParams = useSearchParams();
    const orderNumber = searchParams.get('orderNumber');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null; // Prevent hydration issues
    }

    if (!orderNumber) {
        return (
            <div className="container mx-auto px-4 py-8 md:py-16">
                <Card>
                    <CardContent className="p-6 md:p-8 text-center">
                        <p className="text-base mb-4">No order information found.</p>
                        <Button asChild className="min-h-[44px]">
                            <Link href="/">Return to Home</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-16">
            <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center px-4 md:px-6">
                    <div className="mx-auto mb-4 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-10 w-10 md:h-12 md:w-12 text-green-600" />
                    </div>
                    <CardTitle className="text-xl md:text-2xl">Order Placed Successfully!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 px-4 md:px-6 pb-6 md:pb-8">
                    <div className="text-center space-y-3">
                        <p className="text-sm md:text-base text-muted-foreground">
                            Your order has been received and is being processed.
                        </p>
                        <div className="bg-muted p-4 md:p-5 rounded-lg">
                            <p className="text-xs md:text-sm text-muted-foreground mb-1">Order Number</p>
                            <p className="text-xl md:text-2xl font-bold">{orderNumber}</p>
                        </div>
                    </div>

                    <div className="border-t pt-6 space-y-4">
                        <h3 className="font-semibold text-base">What&apos;s Next?</h3>
                        <ul className="space-y-3 text-sm md:text-base">
                            <li className="flex gap-3">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                                <span>You&apos;ll receive an email confirmation shortly</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                                <span>We&apos;ll prepare your order and contact you for delivery</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
                                <span>Pay with cash when you receive your order</span>
                            </li>
                        </ul>
                    </div>

                    <div className="border-t pt-6 flex flex-col sm:flex-row gap-3">
                        <Button asChild variant="outline" className="flex-1 min-h-[44px]">
                            <Link href={`/account/orders`}>View Orders</Link>
                        </Button>
                        <Button asChild className="flex-1 min-h-[44px]">
                            <Link href="/">Continue Shopping</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Order Success Page with Suspense boundary
 */
export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto px-4 py-8 md:py-16">
                <Card className="max-w-2xl mx-auto">
                    <CardContent className="p-6 md:p-8 text-center">
                        <p className="text-base">Loading...</p>
                    </CardContent>
                </Card>
            </div>
        }>
            <CheckoutSuccessContent />
        </Suspense>
    );
}