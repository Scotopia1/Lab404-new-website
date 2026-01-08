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
                <div className="flex items-center justify-center py-8 md:py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </AccountLayout>
        );
    }

    // Error state
    if (error || !order) {
        return (
            <AccountLayout>
                <div className="space-y-4 md:space-y-6">
                    <div className="flex items-center gap-3 md:gap-4">
                        <Link href="/account/orders">
                            <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Order Not Found</h1>
                    </div>
                    <Card>
                        <CardContent className="p-6 md:p-8 text-center">
                            <p className="text-sm md:text-base text-destructive mb-4">Failed to load order details. Please try again.</p>
                            <Link href="/account/orders">
                                <Button className="min-h-[44px] px-6">Back to Orders</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </AccountLayout>
        );
    }

    return (
        <AccountLayout>
            <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 md:gap-4">
                    <Link href="/account/orders">
                        <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Order #{order.orderNumber}</h1>
                        <p className="text-xs md:text-sm text-muted-foreground">
                            {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                        </p>
                    </div>
                    <OrderStatusBadge status={order.status} className="sm:ml-auto" />
                </div>

                {/* Tracking Number */}
                {order.trackingNumber && (
                    <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="flex items-start sm:items-center gap-3 p-3 md:p-4">
                            <Truck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs md:text-sm font-medium text-blue-900">Tracking Number</p>
                                <p className="text-xs md:text-sm text-blue-700 break-all">{order.trackingNumber}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-4 md:gap-6 md:grid-cols-2">
                    {/* Order Items */}
                    <Card className="md:col-span-2">
                        <CardHeader className="pb-3 md:pb-6">
                            <CardTitle className="text-base md:text-lg">Order Items</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 md:px-6">
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm pb-4 border-b last:border-0 last:pb-0">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm md:text-base">{item.productName}</p>
                                            {item.variantOptions && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {Object.entries(item.variantOptions)
                                                        .map(([key, value]) => `${key}: ${value}`)
                                                        .join(', ')}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-0.5">SKU: {item.sku}</p>
                                            <p className="text-xs md:text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
                                        </div>
                                        <span className="font-medium text-base self-start sm:self-auto">
                                            ${item.total.toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                                <Separator className="my-4" />
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs md:text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>${order.subtotal.toFixed(2)}</span>
                                    </div>
                                    {order.discount > 0 && (
                                        <div className="flex justify-between text-xs md:text-sm">
                                            <span className="text-muted-foreground">
                                                Discount {order.promoCodeSnapshot && `(${order.promoCodeSnapshot})`}
                                            </span>
                                            <span className="text-green-600">-${order.discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {order.tax > 0 && (
                                        <div className="flex justify-between text-xs md:text-sm">
                                            <span className="text-muted-foreground">
                                                Tax ({(order.taxRate * 100).toFixed(0)}%)
                                            </span>
                                            <span>${order.tax.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xs md:text-sm">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span>
                                            {order.shipping === 0
                                                ? 'Free'
                                                : `$${order.shipping.toFixed(2)}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm md:text-base font-medium pt-2 border-t">
                                        <span>Total</span>
                                        <span>${order.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipping Address */}
                    <Card>
                        <CardHeader className="pb-3 md:pb-6">
                            <CardTitle className="text-base md:text-lg">Shipping Address</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs md:text-sm space-y-0.5">
                            <p className="font-medium">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                            {order.shippingAddress.company && <p>{order.shippingAddress.company}</p>}
                            <p className="pt-1">{order.shippingAddress.addressLine1}</p>
                            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                            <p>
                                {order.shippingAddress.city}
                                {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                                {order.shippingAddress.postalCode && ` ${order.shippingAddress.postalCode}`}
                            </p>
                            <p>{order.shippingAddress.country}</p>
                            {order.shippingAddress.phone && <p className="pt-2 text-muted-foreground">Phone: {order.shippingAddress.phone}</p>}
                        </CardContent>
                    </Card>

                    {/* Payment Method */}
                    <Card>
                        <CardHeader className="pb-3 md:pb-6">
                            <CardTitle className="text-base md:text-lg">Payment Method</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs md:text-sm">
                            <p className="capitalize font-medium">{order.paymentMethod.replace('_', ' ')}</p>
                            {order.paymentMethod === 'cod' && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Pay with cash when you receive your order
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Customer Notes */}
                {order.customerNotes && (
                    <Card>
                        <CardHeader className="pb-3 md:pb-6">
                            <CardTitle className="text-base md:text-lg">Order Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs md:text-sm">
                            <p className="text-muted-foreground">{order.customerNotes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AccountLayout>
    );
}
