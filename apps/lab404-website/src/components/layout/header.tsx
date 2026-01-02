'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { User, ChevronDown, Truck } from 'lucide-react';
import { useCategories } from '@/hooks/use-categories';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { CartSheet } from '@/components/cart/cart-sheet';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { SearchBar } from '@/components/search/search-bar';

export function Header() {
    const { isAuthenticated, logout } = useAuthStore();
    const { data: categories } = useCategories();

    return (
        <header className="sticky top-0 z-50 w-full">
            {/* Promo Banner */}
            <div className="bg-primary text-primary-foreground">
                <div className="container-main flex h-10 items-center justify-center gap-2 text-sm font-medium">
                    <Truck className="h-4 w-4" />
                    <span>Free shipping on orders over $50!</span>
                </div>
            </div>

            {/* Main Header */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container-main flex h-16 items-center gap-4">
                    {/* Mobile Menu */}
                    <MobileMenu />

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                            404
                        </div>
                        <span className="hidden font-bold text-xl sm:inline-block">Lab404</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium ml-6">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1 transition-colors hover:text-primary text-foreground/70 outline-none font-semibold">
                                Categories <ChevronDown className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56">
                                {categories?.map((category) => (
                                    <DropdownMenuItem key={category.id} asChild>
                                        <Link href={`/products?category=${category.slug}`} className="w-full">
                                            {category.name}
                                        </Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Link href="/products" className="transition-colors hover:text-primary text-foreground/70 font-semibold">
                            Products
                        </Link>
                        <Link href="/blog" className="transition-colors hover:text-primary text-foreground/70 font-semibold">
                            Blog
                        </Link>
                        <Link href="/order-tracking" className="transition-colors hover:text-primary text-foreground/70 font-semibold">
                            Track Order
                        </Link>
                    </nav>

                    {/* Search & Actions */}
                    <div className="flex flex-1 items-center justify-end gap-3">
                        {/* Search Bar - Hidden on mobile */}
                        <SearchBar className="hidden sm:block" />

                        {/* Cart */}
                        <CartSheet />

                        {/* User Actions - Hidden on mobile */}
                        <div className="hidden sm:flex items-center gap-2">
                            {isAuthenticated ? (
                                <>
                                    <Link href="/account/profile">
                                        <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                                            <User className="h-5 w-5" />
                                            <span className="sr-only">Account</span>
                                        </Button>
                                    </Link>
                                    <Button variant="ghost" size="sm" onClick={() => logout()} className="hover:bg-destructive/10 hover:text-destructive">
                                        Logout
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Link href="/login">
                                        <Button variant="ghost" size="sm" className="font-semibold">
                                            Login
                                        </Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button size="sm" className="font-semibold">
                                            Sign Up
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
