'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { useProducts } from '@/hooks/use-products';
import { useProductFilters } from '@/hooks/use-product-filters';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Loader2 } from 'lucide-react';

import { ProductFilters } from '@/components/products/product-filters';
import { MobileFilterSheet } from '@/components/products/mobile-filter-sheet';
import { SortSelect } from '@/components/products/sort-select';
import { ActiveFilters } from '@/components/products/active-filters';

function ProductsContent() {
    const {
        filters,
        setSearch,
        setCategory,
        setMinPrice,
        setMaxPrice,
        setInStock,
        setSort,
        setPage,
        clearFilter,
        clearAllFilters,
        activeFilterCount,
        hasActiveFilters,
        isPending,
    } = useProductFilters();

    // Local search state for debouncing
    const [searchInput, setSearchInput] = useState(filters.search);

    // Sync search input with URL
    useEffect(() => {
        setSearchInput(filters.search);
    }, [filters.search]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== filters.search) {
                setSearch(searchInput);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput, filters.search, setSearch]);

    const { data, isLoading, isFetching } = useProducts({
        page: filters.page,
        limit: 12,
        category: filters.category,
        search: filters.search,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        inStock: filters.inStock || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
    });

    const handleSearchSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            setSearch(searchInput);
        },
        [searchInput, setSearch]
    );

    return (
        <MainLayout>
            {/* Header row */}
            <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">
                        {data?.meta.total || 0} products found
                        {(isLoading || isFetching || isPending) && (
                            <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <MobileFilterSheet
                        filters={filters}
                        onCategoryChange={setCategory}
                        onMinPriceChange={setMinPrice}
                        onMaxPriceChange={setMaxPrice}
                        onInStockChange={setInStock}
                        onClearAll={clearAllFilters}
                        activeFilterCount={activeFilterCount}
                        className="lg:hidden"
                    />
                    <SortSelect
                        sortBy={filters.sortBy}
                        sortOrder={filters.sortOrder}
                        onSortChange={setSort}
                    />
                </div>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearchSubmit} className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search products..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-10 pr-4"
                    />
                </div>
            </form>

            {/* Active filters */}
            <ActiveFilters
                filters={filters}
                onClearFilter={clearFilter}
                onClearAll={clearAllFilters}
                className="mb-4"
            />

            {/* Main content */}
            <div className="flex gap-8">
                {/* Desktop sidebar */}
                <ProductFilters
                    filters={filters}
                    onCategoryChange={setCategory}
                    onMinPriceChange={setMinPrice}
                    onMaxPriceChange={setMaxPrice}
                    onInStockChange={setInStock}
                    onClearAll={clearAllFilters}
                    hasActiveFilters={hasActiveFilters}
                    className="hidden lg:block"
                />

                {/* Products grid */}
                <div className="flex-1">
                    {isLoading ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-[400px] rounded-xl bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : data?.data.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-lg text-muted-foreground mb-4">
                                No products found matching your criteria.
                            </p>
                            {hasActiveFilters && (
                                <Button variant="outline" onClick={clearAllFilters}>
                                    Clear all filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-3">
                                {data?.data.map((product, index) => (
                                    <Card key={product.id} className="overflow-hidden flex flex-col">
                                        <div className="aspect-square relative bg-muted">
                                            {product.thumbnailUrl && (
                                                <Image
                                                    src={product.thumbnailUrl}
                                                    alt={product.name}
                                                    fill
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                    loading={index < 4 ? 'eager' : 'lazy'}
                                                    priority={index < 4}
                                                    className="object-cover transition-transform hover:scale-105"
                                                />
                                            )}
                                        </div>
                                        <CardHeader className="p-3 md:p-4">
                                            <CardTitle className="line-clamp-1 text-base md:text-lg">
                                                {product.name}
                                            </CardTitle>
                                            <p className="text-xs md:text-sm text-muted-foreground">
                                                {product.category?.name || 'Uncategorized'}
                                            </p>
                                        </CardHeader>
                                        <CardContent className="p-3 md:p-4 pt-0 flex-1">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-lg md:text-xl font-bold">
                                                    ${product.basePrice || product.price}
                                                </span>
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
                                        disabled={filters.page <= 1}
                                        className="min-h-[44px] min-w-[44px] px-4 md:px-6"
                                        onClick={() => setPage(filters.page - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <div className="flex items-center px-3 md:px-4 text-sm md:text-base font-medium">
                                        Page {filters.page} of {data.meta.totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        disabled={filters.page >= data.meta.totalPages}
                                        className="min-h-[44px] min-w-[44px] px-4 md:px-6"
                                        onClick={() => setPage(filters.page + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
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
