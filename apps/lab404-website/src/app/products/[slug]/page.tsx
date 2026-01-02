'use client';

import MainLayout from '@/components/layout/main-layout';
import { useProduct, useRelatedProducts } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/use-cart';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import {
    Loader2,
    Minus,
    Plus,
    ShoppingCart,
    ChevronLeft,
    ChevronRight,
    Shield,
    Truck,
    RefreshCw,
    Check,
    Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProductPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { data: product, isLoading } = useProduct(slug);
    const { data: relatedProducts } = useRelatedProducts(product?.category?.id, product?.id || '', 4);
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const handleAddToCart = async () => {
        if (!product) return;

        setIsAdding(true);
        try {
            await addToCart.mutateAsync({
                productId: product.id,
                quantity,
            });
            toast.success('Added to cart', {
                description: `${product.name} has been added to your cart.`,
            });
        } catch (error) {
            console.error('Failed to add to cart', error);
            toast.error('Failed to add to cart');
        } finally {
            setIsAdding(false);
        }
    };

    const handlePreviousImage = () => {
        if (!product?.images?.length) return;
        setSelectedImageIndex(prev =>
            prev === 0 ? product.images!.length - 1 : prev - 1
        );
    };

    const handleNextImage = () => {
        if (!product?.images?.length) return;
        setSelectedImageIndex(prev =>
            prev === product.images!.length - 1 ? 0 : prev + 1
        );
    };

    const formatPrice = (price: number | string) => {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numPrice);
    };

    const price = product?.basePrice || (product?.price ? parseFloat(product.price) : 0);
    const comparePrice = product?.compareAtPrice ? parseFloat(product.compareAtPrice) : null;
    const savings = comparePrice ? comparePrice - price : 0;

    // Get current image URL
    const currentImageUrl = product?.images?.[selectedImageIndex]?.url || product?.thumbnailUrl;

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex justify-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    if (!product) {
        return (
            <MainLayout>
                <div className="text-center py-20">
                    <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
                    <p className="text-muted-foreground mb-8">The product you&apos;re looking for doesn&apos;t exist.</p>
                    <Link href="/products">
                        <Button>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Back to Products
                        </Button>
                    </Link>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            {/* Breadcrumb */}
            <nav className="mb-6">
                <div className="flex items-center space-x-2 text-sm">
                    <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                        Home
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors">
                        Products
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-medium truncate max-w-[200px]">{product.name}</span>
                </div>
            </nav>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
                {/* Product Images */}
                <div className="space-y-4">
                    <div className="aspect-square relative overflow-hidden rounded-xl bg-muted group">
                        {currentImageUrl && (
                            <Image
                                src={currentImageUrl}
                                alt={product.name}
                                fill
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover"
                                priority
                            />
                        )}

                        {/* Navigation Arrows */}
                        {product.images && product.images.length > 1 && (
                            <>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={handlePreviousImage}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={handleNextImage}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-sm">
                                    {selectedImageIndex + 1} / {product.images.length}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {product.images && product.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {product.images.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImageIndex(index)}
                                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                                        selectedImageIndex === index
                                            ? 'border-primary'
                                            : 'border-muted hover:border-muted-foreground/50'
                                    }`}
                                >
                                    <div className="relative w-full h-full bg-muted">
                                        <Image
                                            src={image.url}
                                            alt={`${product.name} ${index + 1}`}
                                            fill
                                            sizes="80px"
                                            className="object-cover"
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    {/* Category & Name */}
                    <div>
                        <Badge variant="secondary" className="mb-3">
                            {product.category?.name || 'Uncategorized'}
                        </Badge>
                        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                            {product.name}
                        </h1>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            {product.description}
                        </p>
                    )}

                    {/* Price */}
                    <div className="bg-muted/50 p-6 rounded-xl">
                        <div className="flex items-center flex-wrap gap-3 mb-4">
                            <span className="text-4xl font-bold text-primary">
                                {formatPrice(price)}
                            </span>
                            {comparePrice && (
                                <>
                                    <span className="text-xl text-muted-foreground line-through">
                                        {formatPrice(comparePrice)}
                                    </span>
                                    <Badge variant="destructive">
                                        Save {formatPrice(savings)}
                                    </Badge>
                                </>
                            )}
                        </div>

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {product.tags.map((tag) => (
                                    <Badge key={tag} variant="outline">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add to Cart Section */}
                    <div className="border rounded-xl p-6 space-y-6">
                        {/* Quantity Selector */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <span className="font-medium">Quantity:</span>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center rounded-lg border">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={quantity <= 1}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="w-12 text-center text-lg font-medium">
                                        {quantity}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setQuantity(Math.min(10, quantity + 1))}
                                        disabled={quantity >= 10}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Badge variant={product.stockQuantity > 0 ? 'default' : 'destructive'}>
                                    {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                                </Badge>
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <Button
                            size="lg"
                            className="w-full text-lg py-6 font-semibold"
                            onClick={handleAddToCart}
                            disabled={isAdding || product.stockQuantity === 0}
                        >
                            {isAdding ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Adding to Cart...
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="mr-2 h-5 w-5" />
                                    Add {quantity > 1 ? `${quantity} ` : ''}to Cart
                                </>
                            )}
                        </Button>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                            <div className="flex flex-col items-center text-center gap-1">
                                <Shield className="h-5 w-5 text-primary" />
                                <span className="text-xs font-medium">Warranty</span>
                            </div>
                            <div className="flex flex-col items-center text-center gap-1">
                                <Truck className="h-5 w-5 text-green-600" />
                                <span className="text-xs font-medium">Fast Shipping</span>
                            </div>
                            <div className="flex flex-col items-center text-center gap-1">
                                <RefreshCw className="h-5 w-5 text-orange-600" />
                                <span className="text-xs font-medium">Easy Returns</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Features Section */}
            {product.features && product.features.length > 0 && (
                <section className="mt-16">
                    <Card>
                        <CardHeader className="bg-muted/50">
                            <CardTitle className="flex items-center text-2xl">
                                <Sparkles className="h-6 w-6 mr-3 text-primary" />
                                Key Features
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8">
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {product.features.map((feature, index) => (
                                    <li
                                        key={index}
                                        className="flex items-start bg-muted/30 p-4 rounded-lg border"
                                    >
                                        <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                                        <span className="text-foreground leading-relaxed">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Technical Specifications Section */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
                <section className="mt-8">
                    <Card>
                        <CardHeader className="bg-muted/50">
                            <CardTitle className="flex items-center text-2xl">
                                <Shield className="h-6 w-6 mr-3 text-primary" />
                                Technical Specifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {Object.entries(product.specifications).map(([key, value]) => (
                                    <div
                                        key={key}
                                        className="bg-muted/30 rounded-lg p-4 border hover:border-primary/50 transition-colors"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                            <span className="font-semibold text-foreground">{key}:</span>
                                            <span className="text-muted-foreground bg-background px-3 py-1 rounded-md">
                                                {value}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* Related Products */}
            {relatedProducts && relatedProducts.length > 0 && (
                <section className="mt-16">
                    <Separator className="mb-12" />
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold mb-2">Similar Products</h2>
                        <p className="text-muted-foreground">
                            Discover other products from the same category
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {relatedProducts.map((relatedProduct) => (
                            <Card key={relatedProduct.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                                <div className="aspect-square relative bg-muted">
                                    {relatedProduct.thumbnailUrl && (
                                        <Image
                                            src={relatedProduct.thumbnailUrl}
                                            alt={relatedProduct.name}
                                            fill
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                            className="object-cover transition-transform group-hover:scale-105"
                                        />
                                    )}
                                </div>
                                <CardHeader className="p-4">
                                    <p className="text-sm text-muted-foreground">
                                        {relatedProduct.category?.name || 'Uncategorized'}
                                    </p>
                                    <CardTitle className="line-clamp-1 text-lg">{relatedProduct.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold">
                                            ${relatedProduct.basePrice || relatedProduct.price}
                                        </span>
                                        {relatedProduct.compareAtPrice && (
                                            <span className="text-sm text-muted-foreground line-through">
                                                ${relatedProduct.compareAtPrice}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 pt-0">
                                    <Link href={`/products/${relatedProduct.slug}`} className="w-full">
                                        <Button variant="outline" className="w-full">View Details</Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    <div className="text-center mt-8">
                        <Link href="/products">
                            <Button variant="outline" size="lg">
                                View All Products
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </section>
            )}
        </MainLayout>
    );
}
