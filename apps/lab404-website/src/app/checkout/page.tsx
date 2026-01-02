'use client';

import MainLayout from '@/components/layout/main-layout';
import { CheckoutForm } from '@/components/checkout/checkout-form';

export default function CheckoutPage() {
    return (
        <MainLayout>
            <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>
            <CheckoutForm />
        </MainLayout>
    );
}
