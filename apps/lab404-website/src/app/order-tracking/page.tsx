'use client';

import MainLayout from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Package } from 'lucide-react';

export default function OrderTrackingPage() {
    return (
        <MainLayout>
            <div className="max-w-xl mx-auto py-8">
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <Package className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Track Your Order</h1>
                    <p className="mt-2 text-muted-foreground">
                        Enter your order ID and email address to track your shipment.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Order Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="orderId" className="text-sm font-medium">Order ID</label>
                            <Input id="orderId" placeholder="e.g. ORD-12345" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                            <Input id="email" type="email" placeholder="john@example.com" />
                        </div>
                        <Button className="w-full" size="lg">
                            <Search className="mr-2 h-4 w-4" />
                            Track Order
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
