'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, CheckoutFormData } from '@/lib/checkout-validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/hooks/use-cart';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export function CheckoutForm() {
    const { cart, clearCart } = useCart(); // Need to implement clearCart in use-cart
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
    });

    const onSubmit = async (data: CheckoutFormData) => {
        if (!cart || cart.items.length === 0) {
            toast.error('Your cart is empty');
            return;
        }

        setIsSubmitting(true);
        try {
            // Send order to backend
            await api.post('/orders', {
                shippingAddress: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    address: data.address,
                    city: data.city,
                    state: data.state,
                    zipCode: data.zipCode,
                    country: data.country,
                },
                paymentMethod: {
                    cardNumber: data.cardNumber.slice(-4), // Don't send full card to backend in this demo
                    provider: 'visa', // Mock provider
                },
                items: cart.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.product.price
                }))
            });

            // Clear cart after successful order
            await clearCart.mutateAsync();

            toast.success('Order placed successfully!');
            router.push('/checkout/success');
        } catch (error) {
            toast.error('Failed to place order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Shipping Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" {...register('firstName')} />
                            {errors.firstName && (
                                <p className="text-sm text-destructive">{errors.firstName.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" {...register('lastName')} />
                            {errors.lastName && (
                                <p className="text-sm text-destructive">{errors.lastName.message}</p>
                            )}
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" {...register('email')} />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" {...register('address')} />
                            {errors.address && (
                                <p className="text-sm text-destructive">{errors.address.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input id="city" {...register('city')} />
                            {errors.city && (
                                <p className="text-sm text-destructive">{errors.city.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input id="state" {...register('state')} />
                            {errors.state && (
                                <p className="text-sm text-destructive">{errors.state.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="zipCode">Zip Code</Label>
                            <Input id="zipCode" {...register('zipCode')} />
                            {errors.zipCode && (
                                <p className="text-sm text-destructive">{errors.zipCode.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input id="country" {...register('country')} />
                            {errors.country && (
                                <p className="text-sm text-destructive">{errors.country.message}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cardNumber">Card Number</Label>
                            <Input id="cardNumber" placeholder="0000 0000 0000 0000" {...register('cardNumber')} />
                            {errors.cardNumber && (
                                <p className="text-sm text-destructive">{errors.cardNumber.message}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="expiryDate">Expiry Date</Label>
                                <Input id="expiryDate" placeholder="MM/YY" {...register('expiryDate')} />
                                {errors.expiryDate && (
                                    <p className="text-sm text-destructive">{errors.expiryDate.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cvc">CVC</Label>
                                <Input id="cvc" placeholder="123" {...register('cvc')} />
                                {errors.cvc && (
                                    <p className="text-sm text-destructive">{errors.cvc.message}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {cart?.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span>
                                    {item.quantity}x {item.product.name}
                                </span>
                                <span>${(Number(item.product.price) * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="border-t pt-4 space-y-4">
                            <div className="flex gap-2">
                                <Input placeholder="Promo code" />
                                <Button variant="outline">Apply</Button>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>${cart?.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span>Free</span>
                                </div>
                                <div className="flex justify-between text-base font-medium pt-2">
                                    <span>Total</span>
                                    <span>${cart?.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <Button className="w-full" size="lg" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Place Order
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </form>
    );
}
