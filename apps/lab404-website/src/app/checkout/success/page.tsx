'use client';

import MainLayout from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function OrderSuccessPage() {
    return (
        <MainLayout>
            <div className="container flex flex-col items-center justify-center py-20 text-center">
                <div className="rounded-full bg-green-100 p-6 dark:bg-green-900/20">
                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="mt-8 text-3xl font-bold tracking-tight">Order Placed Successfully!</h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-md">
                    Thank you for your purchase. We have received your order and will send you a confirmation email shortly.
                </p>
                <div className="mt-10 flex gap-4">
                    <Link href="/products">
                        <Button size="lg">Continue Shopping</Button>
                    </Link>
                    <Link href="/account/orders">
                        <Button variant="outline" size="lg">View Order</Button>
                    </Link>
                </div>
            </div>
        </MainLayout>
    );
}
