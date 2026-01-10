'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, CheckoutFormData } from '@/lib/checkout-validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Banknote, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useAddresses, Address } from '@/hooks/use-addresses';
import { formatPrice } from '@/lib/format';

export function CheckoutForm() {
    const { cart, clearCart } = useCart();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data: addresses, isLoading: isLoadingAddresses } = useAddresses();
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [useManualEntry, setUseManualEntry] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        reset,
    } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
    });

    // Filter shipping addresses and get default
    const shippingAddresses = addresses?.filter(a => a.type === 'shipping') || [];
    const defaultShippingAddress = shippingAddresses.find(a => a.isDefault);

    // Auto-select default address on mount
    useEffect(() => {
        if (defaultShippingAddress && !selectedAddressId && !useManualEntry && shippingAddresses.length > 0) {
            setSelectedAddressId(defaultShippingAddress.id);
        }
    }, [defaultShippingAddress, selectedAddressId, useManualEntry, shippingAddresses.length]);

    // Get selected address
    const selectedAddress = shippingAddresses.find(a => a.id === selectedAddressId);

    // Populate form when address selected
    useEffect(() => {
        if (selectedAddress && !useManualEntry) {
            setValue('firstName', selectedAddress.firstName);
            setValue('lastName', selectedAddress.lastName);
            setValue('company', selectedAddress.company || '');
            setValue('addressLine1', selectedAddress.addressLine1);
            setValue('addressLine2', selectedAddress.addressLine2 || '');
            setValue('city', selectedAddress.city);
            setValue('state', selectedAddress.state || '');
            setValue('postalCode', selectedAddress.postalCode || '');
            setValue('country', selectedAddress.country);
            setValue('phone', selectedAddress.phone || '');
        } else if (useManualEntry && selectedAddressId) {
            // Clear form when switching to manual entry
            setSelectedAddressId(null);
        }
    }, [selectedAddress, useManualEntry, setValue, selectedAddressId]);

    const onSubmit = async (data: CheckoutFormData) => {
        if (!cart || cart.items.length === 0) {
            toast.error('Your cart is empty');
            return;
        }

        setIsSubmitting(true);
        try {
            // Send order to backend with COD payment
            const response = await api.post('/orders', {
                // Customer email at root level (not in address)
                customerEmail: data.email,

                // Shipping address with correct field names
                shippingAddress: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    company: data.company,
                    addressLine1: data.addressLine1,
                    addressLine2: data.addressLine2,
                    city: data.city,
                    state: data.state,
                    postalCode: data.postalCode,
                    country: data.country,
                    phone: data.phone,
                },

                // Billing same as shipping (API default: true)
                sameAsShipping: true,

                // COD payment method (API default: 'cod')
                paymentMethod: 'cod',

                // Optional customer notes
                customerNotes: data.customerNotes,
            });

            // Clear cart after successful order
            await clearCart.mutateAsync();

            toast.success('Order placed successfully!');

            // Navigate to order confirmation with order number
            const orderNumber = response.data.data.orderNumber;
            router.push(`/checkout/success?orderNumber=${orderNumber}`);
        } catch (error: any) {
            console.error('Order creation error:', error);

            // Specific error handling
            if (error.response?.status === 400) {
                const message = error.response.data?.message || 'Invalid order data';
                toast.error(message);
            } else if (error.response?.status === 404) {
                toast.error('Cart not found. Please add items to your cart.');
            } else if (error.response?.status === 409) {
                toast.error('Some items in your cart are out of stock.');
            } else if (error.response?.status === 429) {
                toast.error('Too many requests. Please wait a moment and try again.');
            } else {
                toast.error('Failed to place order. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Empty cart check
    if (!cart || cart.items.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground mb-4">Your cart is empty</p>
                    <Button asChild>
                        <Link href="/products">Continue Shopping</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Shipping Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Saved Addresses Section */}
                        {!isLoadingAddresses && shippingAddresses.length > 0 && !useManualEntry && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">Select a saved address</h3>
                                <div className="space-y-3">
                                    {shippingAddresses.map((address) => (
                                        <div
                                            key={address.id}
                                            className={`relative flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors min-h-[44px] ${
                                                selectedAddressId === address.id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-input hover:border-primary/50'
                                            }`}
                                            onClick={() => setSelectedAddressId(address.id)}
                                        >
                                            <input
                                                type="radio"
                                                name="savedAddress"
                                                value={address.id}
                                                checked={selectedAddressId === address.id}
                                                onChange={() => setSelectedAddressId(address.id)}
                                                className="mt-1 h-5 w-5 min-h-[20px] min-w-[20px] text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">
                                                        {address.firstName} {address.lastName}
                                                    </span>
                                                    {address.isDefault && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Default
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {address.addressLine1}, {address.city}
                                                    {address.state && `, ${address.state}`}
                                                    {address.postalCode && ` ${address.postalCode}`}
                                                    <br />
                                                    {address.country}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setUseManualEntry(true);
                                        reset();
                                    }}
                                    className="w-full min-h-[44px]"
                                >
                                    Use a different address
                                </Button>
                            </div>
                        )}

                        {/* Manual Address Entry */}
                        {(useManualEntry || shippingAddresses.length === 0) && (
                            <div className="space-y-4">
                                {shippingAddresses.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setUseManualEntry(false)}
                                        className="w-full mb-4 min-h-[44px]"
                                    >
                                        Choose from saved addresses
                                    </Button>
                                )}

                                {/* Email field */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input 
                                        id="email" 
                                        type="email" 
                                        autoComplete="email"
                                        className="text-base"
                                        placeholder="you@example.com"
                                        {...register('email')} 
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-destructive">{errors.email.message}</p>
                                    )}
                                </div>

                                {/* Name fields */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input 
                                            id="firstName" 
                                            autoComplete="given-name"
                                            className="text-base"
                                            {...register('firstName')} 
                                        />
                                        {errors.firstName && (
                                            <p className="text-sm text-destructive">{errors.firstName.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input 
                                            id="lastName" 
                                            autoComplete="family-name"
                                            className="text-base"
                                            {...register('lastName')} 
                                        />
                                        {errors.lastName && (
                                            <p className="text-sm text-destructive">{errors.lastName.message}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Company */}
                                <div className="space-y-2">
                                    <Label htmlFor="company">Company (Optional)</Label>
                                    <Input 
                                        id="company" 
                                        autoComplete="organization"
                                        className="text-base"
                                        {...register('company')} 
                                    />
                                    {errors.company && (
                                        <p className="text-sm text-destructive">{errors.company.message}</p>
                                    )}
                                </div>

                                {/* Address fields */}
                                <div className="space-y-2">
                                    <Label htmlFor="addressLine1">Address Line 1</Label>
                                    <Input 
                                        id="addressLine1" 
                                        autoComplete="address-line1"
                                        className="text-base"
                                        {...register('addressLine1')} 
                                    />
                                    {errors.addressLine1 && (
                                        <p className="text-sm text-destructive">{errors.addressLine1.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                                    <Input 
                                        id="addressLine2" 
                                        autoComplete="address-line2"
                                        className="text-base"
                                        {...register('addressLine2')} 
                                    />
                                    {errors.addressLine2 && (
                                        <p className="text-sm text-destructive">{errors.addressLine2.message}</p>
                                    )}
                                </div>

                                {/* City, State, Postal Code */}
                                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input 
                                            id="city" 
                                            autoComplete="address-level2"
                                            className="text-base"
                                            {...register('city')} 
                                        />
                                        {errors.city && (
                                            <p className="text-sm text-destructive">{errors.city.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">State (Optional)</Label>
                                        <Input 
                                            id="state" 
                                            autoComplete="address-level1"
                                            className="text-base"
                                            {...register('state')} 
                                        />
                                        {errors.state && (
                                            <p className="text-sm text-destructive">{errors.state.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="postalCode">Postal Code (Optional)</Label>
                                        <Input 
                                            id="postalCode" 
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="postal-code"
                                            className="text-base"
                                            {...register('postalCode')} 
                                        />
                                        {errors.postalCode && (
                                            <p className="text-sm text-destructive">{errors.postalCode.message}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Country */}
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input 
                                        id="country" 
                                        autoComplete="country-name"
                                        className="text-base"
                                        {...register('country')} 
                                    />
                                    {errors.country && (
                                        <p className="text-sm text-destructive">{errors.country.message}</p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone (Optional)</Label>
                                    <Input 
                                        id="phone" 
                                        type="tel" 
                                        autoComplete="tel"
                                        className="text-base"
                                        placeholder="+1 (555) 000-0000"
                                        {...register('phone')} 
                                    />
                                    {errors.phone && (
                                        <p className="text-sm text-destructive">{errors.phone.message}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Email field when using saved address */}
                        {!useManualEntry && shippingAddresses.length > 0 && (
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    autoComplete="email"
                                    className="text-base"
                                    placeholder="you@example.com"
                                    {...register('email')} 
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email.message}</p>
                                )}
                            </div>
                        )}

                        {/* Order Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="customerNotes">Order Notes (Optional)</Label>
                            <textarea
                                id="customerNotes"
                                {...register('customerNotes')}
                                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Any special instructions for your order?"
                            />
                            {errors.customerNotes && (
                                <p className="text-sm text-destructive">{errors.customerNotes.message}</p>
                            )}
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
                                <span>{formatPrice(item.lineTotal)}</span>
                            </div>
                        ))}
                        <div className="border-t pt-4 space-y-4">
                            {/* COD Payment Method Indicator */}
                            <div className="bg-muted p-3 rounded-lg">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Banknote className="h-5 w-5" />
                                    <span>Payment Method: Cash on Delivery (COD)</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Pay when you receive your order
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Promo code" 
                                    className="text-base"
                                />
                                <Button variant="outline" type="button" className="min-h-[44px]">Apply</Button>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>${cart?.subtotal.toFixed(2)}</span>
                                </div>
                                {cart?.taxAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Tax</span>
                                        <span>${cart?.taxAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span>Free</span>
                                </div>
                                <div className="flex justify-between text-base font-medium pt-2 border-t">
                                    <span>Total</span>
                                    <span>${cart?.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <Button className="w-full min-h-[52px] text-base font-semibold" size="lg" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Place Order - Pay on Delivery
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </form>
    );
}