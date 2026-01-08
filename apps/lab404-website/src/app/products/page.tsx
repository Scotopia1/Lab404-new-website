'use client';

import MainLayout from '@/components/layout/main-layout';
import { useProducts } from '@/hooks/use-products';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function ProductsContent() {
    const searchParams = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    const { data, isLoading } = useProducts({
        page,
        limit: 12,
        category,
        search,
    });

    return (
        <MainLayout>
            <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between mb-6 md:mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">
                        {data?.meta.total || 0} products found
                    </p>
                </div>
                {/* Add filters/sorting here later */}
            </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-[400px] rounded-xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                            {data?.data.map((product, index) => (
                                <Card key={product.id} className="overflow-hidden flex flex-col">
                                    <div className="aspect-square relative bg-muted">
                                        {product.thumbnailUrl && (
                                            <Image
                                                src={product.thumbnailUrl}
                                                alt={product.name}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                                loading={index < 4 ? 'eager' : 'lazy'}
                                                priority={index < 4}
                                                className="object-cover transition-transform hover:scale-105"
                                            />
                                        )}
                                    </div>
                                    <CardHeader className="p-3 md:p-4">
                                        <CardTitle className="line-clamp-1 text-base md:text-lg">{product.name}</CardTitle>
                                        <p className="text-xs md:text-sm text-muted-foreground">{product.category?.name || 'Uncategorized'}</p>
                                    </CardHeader>
                                    <CardContent className="p-3 md:p-4 pt-0 flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-lg md:text-xl font-bold">${product.basePrice || product.price}</span>
                                            {product.compareAtPrice && (
                                                <span className="text-sm text-muted-foreground line-through">
                                                    ${product.compareAtPrice}
                                                </span>
                                            )}
                                        </div>
                                        {product.shortDescription && (
                                            <p className="mt-2 text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                                                {product.shortDescription}
                                            </p>
                                        )}
                                    </CardContent>
                                    <CardFooter className="p-3 md:p-4 pt-0">
                                        <Link href={`/products/${product.slug}`} className="w-full">
                                            <Button className="w-full min-h-[44px]">View Details</Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {data?.meta && data.meta.totalPages > 1 && (
                            <div className="mt-8 md:mt-10 flex justify-center gap-3 md:gap-4 items-center">
                                <Button
                                    variant="outline"
                                    disabled={page <= 1}
                                    className="min-h-[44px] min-w-[44px] px-4 md:px-6"
                                    onClick={() => {
                                        // Handle navigation
                                        const params = new URLSearchParams(searchParams);
                                        params.set('page', String(page - 1));
                                        window.location.search = params.toString();
                                    }}
                                >
                                    Previous
                                </Button>
                                <div className="flex items-center px-3 md:px-4 text-sm md:text-base font-medium">
                                    Page {page} of {data.meta.totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    disabled={page >= data.meta.totalPages}
                                    className="min-h-[44px] min-w-[44px] px-4 md:px-6"
                                    onClick={() => {
                                        const params = new URLSearchParams(searchParams);
                                        params.set('page', String(page + 1));
                                        window.location.search = params.toString();
                                    }}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
        </MainLayout>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProductsContent />
        </Suspense>
    );
}