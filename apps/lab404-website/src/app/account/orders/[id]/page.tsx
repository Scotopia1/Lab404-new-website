'use client';

import AccountLayout from '@/components/layout/account-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Mock data
const order = {
    id: 'ORD-001',
    date: '2023-12-01',
    status: 'Delivered',
    total: 129.99,
    subtotal: 119.99,
    shipping: 10.00,
    shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
    },
    items: [
        {
            id: '1',
            name: 'Arduino Uno R3',
            price: 24.99,
            quantity: 2,
        },
        {
            id: '2',
            name: 'Raspberry Pi 4',
            price: 70.01,
            quantity: 1,
        },
    ],
};

export default function OrderDetailPage() {
    const params = useParams();
    const id = params.id as string;

    // In a real app, fetch order by id
    // const { data: order } = useOrder(id);

    return (
        <AccountLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/account/orders">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Order #{id}</h1>
                        <p className="text-muted-foreground">
                            Placed on {order.date}
                        </p>
                    </div>
                    <Badge className="ml-auto" variant={order.status === 'Delivered' ? 'secondary' : 'default'}>
                        {order.status}
                    </Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span>
                                            {item.quantity}x {item.name}
                                        </span>
                                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                                <Separator className="my-4" />
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>${order.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span>${order.shipping.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-medium pt-2">
                                        <span>Total</span>
                                        <span>${order.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Shipping Address</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                            <p>{order.shippingAddress.address}</p>
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                            <p>{order.shippingAddress.country}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Method</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <p>Visa ending in 4242</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AccountLayout>
    );
}
