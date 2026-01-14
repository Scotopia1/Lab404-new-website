'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import MainLayout from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Search, Package, Loader2, AlertCircle, Truck, Calendar, MapPin, ShoppingBag, DollarSign } from 'lucide-react';
import { trackOrderSchema, TrackOrderFormData } from '@/lib/validations';
import { useTrackOrder } from '@/hooks/use-track-order';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { OrderTimeline } from '@/components/orders/order-timeline';

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const form = useForm<TrackOrderFormData>({
    resolver: zodResolver(trackOrderSchema),
    defaultValues: {
      orderNumber: '',
      email: '',
    },
  });

  const {
    data: trackingResult,
    isLoading,
    error,
    isError,
  } = useTrackOrder(orderNumber);

  function onSubmit(data: TrackOrderFormData) {
    // Strip leading # if present (admin displays orders with # prefix but DB stores without)
    let cleanOrderNumber = data.orderNumber.trim();
    if (cleanOrderNumber.startsWith('#')) {
      cleanOrderNumber = cleanOrderNumber.slice(1);
    }
    setOrderNumber(cleanOrderNumber);
  }

  function handleReset() {
    setOrderNumber(null);
    form.reset();
  }

  // Determine error message
  const errorMessage = isError
    ? (error as any)?.response?.status === 404
      ? 'Order not found. Please check your order ID and try again.'
      : 'Unable to track your order. Please try again later.'
    : null;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Track Your Order</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your order ID to track your shipment status.
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>
              Enter your order information below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. ORD-2025-00002"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email Address
                        <span className="text-muted-foreground text-xs ml-1">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Tracking...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Track Order
                      </>
                    )}
                  </Button>
                  {orderNumber && (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={handleReset}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Error State */}
        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {trackingResult && (
          <div className="space-y-6">
            {/* Order Summary Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-lg">
                      Order #{trackingResult.orderNumber}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3.5 w-3.5 inline mr-1" />
                      {new Date(trackingResult.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <OrderStatusBadge status={trackingResult.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      Total
                    </div>
                    <p className="font-semibold text-lg">${trackingResult.total.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Items
                    </div>
                    <p className="font-semibold text-lg">{trackingResult.itemCount}</p>
                  </div>
                  {trackingResult.shippingLocation && (
                    <div className="p-3 bg-muted/50 rounded-lg col-span-2 sm:col-span-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <MapPin className="h-3.5 w-3.5" />
                        Ship To
                      </div>
                      <p className="font-semibold text-sm truncate">
                        {[trackingResult.shippingLocation.city, trackingResult.shippingLocation.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                {trackingResult.items.length > 0 && (
                  <div className="border rounded-lg">
                    <div className="p-3 border-b bg-muted/30">
                      <h4 className="font-medium text-sm">Order Items</h4>
                    </div>
                    <div className="divide-y">
                      {trackingResult.items.map((item, index) => (
                        <div key={index} className="p-3 flex justify-between items-center gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shipping Info */}
                {(trackingResult.shippingMethod || trackingResult.trackingNumber) && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                    {trackingResult.shippingMethod && (
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-700">Shipping Method:</span>
                        <span className="font-medium text-blue-900">{trackingResult.shippingMethod}</span>
                      </div>
                    )}
                    {trackingResult.trackingNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-700">Tracking Number:</span>
                        <span className="font-medium font-mono text-blue-900">
                          {trackingResult.trackingNumber}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderTimeline
                  status={trackingResult.status}
                  timeline={trackingResult.timeline}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
