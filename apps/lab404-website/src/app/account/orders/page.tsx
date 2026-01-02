'use client';

import AccountLayout from '@/components/layout/account-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Mock data for now
const orders = [
    {
        id: 'ORD-001',
        date: '2023-12-01',
        status: 'Delivered',
        total: 129.99,
        items: 3,
    },
    {
        id: 'ORD-002',
        date: '2023-11-15',
        status: 'Processing',
        total: 59.99,
        items: 1,
    },
];

export default function OrdersPage() {
    return (
        <AccountLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                    <p className="text-muted-foreground">
                        View your order history and status.
                    </p>
                </div>

                <div className="space-y-4">
                    {orders.map((order) => (
                        <Card key={order.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-medium">
                                    Order #{order.id}
                                </CardTitle>
                                <Badge variant={order.status === 'Delivered' ? 'secondary' : 'default'}>
                                    {order.status}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="text-muted-foreground">
                                        <p>Placed on {order.date}</p>
                                        <p>{order.items} items</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-medium">${order.total}</span>
                                        <Link href={`/account/orders/${order.id}`}>
                                            <Button variant="outline" size="sm">View Details</Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AccountLayout>
    );
}
