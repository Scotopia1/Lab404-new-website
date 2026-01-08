'use client';

import AccountLayout from '@/components/layout/account-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { useOrder } from '@/hooks/use-orders';
import { ArrowLeft, Loader2, Truck } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';

export default function OrderDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { data: order, isLoading, error } = useOrder(id);

    // Loading state
    if (isLoading) {
        return (
            <AccountLayout>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </AccountLayout>
        );
    }

    // Error state
    if (error || !order) {
        return (
            <AccountLayout>
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Link href="/account/orders">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight">Order Not Found</h1>
                    </div>
                    <Card>
                        <CardContent className="p-8 text-center">
                            <p className="text-destructive">Failed to load order details. Please try again.</p>
                            <Link href="/account/orders">
                                <Button className="mt-4">Back to Orders</Button>
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
                <div className="flex items-center gap-4">
                    <Link href="/account/orders">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Order #{order.orderNumber}</h1>
                        <p className="text-muted-foreground">
                            Placed on {format(new Date(order.createdAt), 'MMMM dd, yyyy')}
                        </p>
                    </div>
                    <OrderStatusBadge status={order.status} className="ml-auto" />
                </div>

                {/* Tracking Number */}
                {order.trackingNumber && (
                    <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="flex items-center gap-3 p-4">
                            <Truck className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-sm font-medium text-blue-900">Tracking Number</p>
                                <p className="text-sm text-blue-700">{order.trackingNumber}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Order Items */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <div>
                                            <p className="font-medium">{item.productName}</p>
                                            {item.variantOptions && (
                                                <p className="text-xs text-muted-foreground">
                                                    {Object.entries(item.variantOptions)
                                                        .map(([key, value]) => `${key}: ${value}`)
                                                        .join(', ')}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                                            <p className="text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                        <span className="font-medium">
                                            ${item.total.toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                                <Separator className="my-4" />
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>${order.subtotal.toFixed(2)}</span>
                                    </div>
                                    {order.discount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Discount {order.promoCodeSnapshot && `(${order.promoCodeSnapshot})`}
                                            </span>
                                            <span className="text-green-600">-${order.discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {order.tax > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Tax ({(order.taxRate * 100).toFixed(0)}%)
                                            </span>
                                            <span>${order.tax.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span>
                                            {order.shipping === 0
                                                ? 'Free'
                                                : `$${order.shipping.toFixed(2)}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-base font-medium pt-2 border-t">
                                        <span>Total</span>
                                        <span>${order.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipping Address */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Shipping Address</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                            {order.shippingAddress.company && <p>{order.shippingAddress.company}</p>}
                            <p>{order.shippingAddress.addressLine1}</p>
                            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                            <p>
                                {order.shippingAddress.city}
                                {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                                {order.shippingAddress.postalCode && ` ${order.shippingAddress.postalCode}`}
                            </p>
                            <p>{order.shippingAddress.country}</p>
                            {order.shippingAddress.phone && <p className="mt-2">Phone: {order.shippingAddress.phone}</p>}
                        </CardContent>
                    </Card>

                    {/* Payment Method */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Method</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <p className="capitalize">{order.paymentMethod.replace('_', ' ')}</p>
                            {order.paymentMethod === 'cod' && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Pay with cash when you receive your order
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Customer Notes */}
                {order.customerNotes && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <p className="text-muted-foreground">{order.customerNotes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AccountLayout>
    );
}
