'use client';

import MainLayout from '@/components/layout/main-layout';
import { CheckoutForm } from '@/components/checkout/checkout-form';

export default function CheckoutPage() {
    return (
        <MainLayout>
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Checkout</h1>
                <p className="text-sm text-muted-foreground mt-2">
                    Complete your order details
                </p>
            </div>
            <CheckoutForm />
        </MainLayout>
    );
}