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
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-muted-foreground">
                        {data?.meta.total || 0} products found
                    </p>
                </div>
                {/* Add filters/sorting here later */}
            </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-[400px] rounded-xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {data?.data.map((product) => (
                                <Card key={product.id} className="overflow-hidden flex flex-col">
                                    <div className="aspect-square relative bg-muted">
                                        {product.thumbnailUrl && (
                                            <Image
                                                src={product.thumbnailUrl}
                                                alt={product.name}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                                className="object-cover transition-transform hover:scale-105"
                                            />
                                        )}
                                    </div>
                                    <CardHeader className="p-4">
                                        <CardTitle className="line-clamp-1 text-lg">{product.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{product.category?.name || 'Uncategorized'}</p>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-lg font-bold">${product.basePrice || product.price}</span>
                                            {product.compareAtPrice && (
                                                <span className="text-sm text-muted-foreground line-through">
                                                    ${product.compareAtPrice}
                                                </span>
                                            )}
                                        </div>
                                        {product.shortDescription && (
                                            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                                {product.shortDescription}
                                            </p>
                                        )}
                                    </CardContent>
                                    <CardFooter className="p-4 pt-0">
                                        <Link href={`/products/${product.slug}`} className="w-full">
                                            <Button className="w-full">View Details</Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {data?.meta && data.meta.totalPages > 1 && (
                            <div className="mt-10 flex justify-center gap-2">
                                <Button
                                    variant="outline"
                                    disabled={page <= 1}
                                    onClick={() => {
                                        // Handle navigation
                                        const params = new URLSearchParams(searchParams);
                                        params.set('page', String(page - 1));
                                        window.location.search = params.toString();
                                    }}
                                >
                                    Previous
                                </Button>
                                <div className="flex items-center px-4 text-sm font-medium">
                                    Page {page} of {data.meta.totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    disabled={page >= data.meta.totalPages}
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
