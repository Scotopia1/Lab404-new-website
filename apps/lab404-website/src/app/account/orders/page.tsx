'use client';

import AccountLayout from '@/components/layout/account-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { useOrders } from '@/hooks/use-orders';
import Link from 'next/link';
import { Loader2, Package } from 'lucide-react';
import { format } from 'date-fns';

export default function OrdersPage() {
    const { data, isLoading, error } = useOrders();

    // Loading state
    if (isLoading) {
        return (
            <AccountLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                        <p className="text-muted-foreground">
                            View your order history and status.
                        </p>
                    </div>
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </div>
            </AccountLayout>
        );
    }

    // Error state
    if (error) {
        return (
            <AccountLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                        <p className="text-muted-foreground">
                            View your order history and status.
                        </p>
                    </div>
                    <Card>
                        <CardContent className="p-8 text-center">
                            <p className="text-destructive">Failed to load orders. Please try again.</p>
                        </CardContent>
                    </Card>
                </div>
            </AccountLayout>
        );
    }

    const orders = data?.data || [];

    // Empty state
    if (orders.length === 0) {
        return (
            <AccountLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                        <p className="text-muted-foreground">
                            View your order history and status.
                        </p>
                    </div>
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Package className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                When you place orders, they'll appear here.
                            </p>
                            <Link href="/products">
                                <Button>Continue Shopping</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </AccountLayout>
        );
    }

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
                                    Order #{order.orderNumber}
                                </CardTitle>
                                <OrderStatusBadge status={order.status} />
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="text-muted-foreground">
                                        <p>Placed on {format(new Date(order.createdAt), 'MMM dd, yyyy')}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-medium">${order.totalSnapshot.toFixed(2)}</span>
                                        <Link href={`/account/orders/${order.id}`}>
                                            <Button variant="outline" size="sm">View Details</Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Pagination (if needed based on data.pagination) */}
                {data?.pagination && data.pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        <p className="text-sm text-muted-foreground">
                            Page {data.pagination.page} of {data.pagination.totalPages}
                        </p>
                    </div>
                )}
            </div>
        </AccountLayout>
    );
}
