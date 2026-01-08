'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Order Success Page
 *
 * Displays confirmation after successful COD order placement.
 * Shows order number and next steps for COD payment.
 */
export default function CheckoutSuccessPage() {
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
            <div className="container mx-auto px-4 py-16">
                <Card>
                    <CardContent className="p-8 text-center">
                        <p>No order information found.</p>
                        <Button asChild className="mt-4">
                            <Link href="/">Return to Home</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-16">
            <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">Order Placed Successfully!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center space-y-2">
                        <p className="text-muted-foreground">
                            Your order has been received and is being processed.
                        </p>
                        <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Order Number</p>
                            <p className="text-2xl font-bold">{orderNumber}</p>
                        </div>
                    </div>

                    <div className="border-t pt-6 space-y-4">
                        <h3 className="font-semibold">What&apos;s Next?</h3>
                        <ul className="space-y-3 text-sm">
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
                        <Button asChild variant="outline" className="flex-1">
                            <Link href={`/account/orders`}>View Orders</Link>
                        </Button>
                        <Button asChild className="flex-1">
                            <Link href="/">Continue Shopping</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
