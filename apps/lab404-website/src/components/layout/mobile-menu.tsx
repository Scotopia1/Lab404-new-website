'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Search, ChevronDown, ChevronRight, User, Package, MapPin, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCategories } from '@/hooks/use-categories';
import { useAuthStore } from '@/store/auth-store';

export function MobileMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const { data: categories } = useCategories();
    const { isAuthenticated, user, logout } = useAuthStore();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
            setIsOpen(false);
        }
    };

    const handleLogout = () => {
        logout();
        setIsOpen(false);
    };

    const navLinks = [
        { href: '/products', label: 'All Products', icon: Package },
        { href: '/blog', label: 'Blog', icon: null },
        { href: '/order-tracking', label: 'Track Order', icon: MapPin },
    ];

    const accountLinks = [
        { href: '/account/profile', label: 'Profile', icon: User },
        { href: '/account/orders', label: 'Orders', icon: Package },
        { href: '/account/addresses', label: 'Addresses', icon: MapPin },
    ];

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
                <SheetHeader className="border-b p-4">
                    <SheetTitle className="text-left font-bold text-lg">
                        Lab404 Electronics
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-60px)]">
                    <div className="p-4 space-y-4">
                        {/* Search */}
                        <form onSubmit={handleSearch}>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </form>

                        <Separator />

                        {/* Categories Accordion */}
                        <div>
                            <button
                                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                                className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-primary transition-colors"
                            >
                                <span>Categories</span>
                                {isCategoriesOpen ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </button>
                            {isCategoriesOpen && (
                                <div className="ml-4 space-y-1 mt-2">
                                    {categories?.map((category) => (
                                        <SheetClose asChild key={category.id}>
                                            <Link
                                                href={`/products?category=${category.slug}`}
                                                className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {category.name}
                                            </Link>
                                        </SheetClose>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Navigation Links */}
                        <nav className="space-y-1">
                            {navLinks.map((link) => (
                                <SheetClose asChild key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="flex items-center gap-3 py-2 text-sm font-medium hover:text-primary transition-colors"
                                    >
                                        {link.icon && <link.icon className="h-4 w-4" />}
                                        {link.label}
                                    </Link>
                                </SheetClose>
                            ))}
                        </nav>

                        <Separator />

                        {/* Account Section */}
                        {isAuthenticated ? (
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                    My Account
                                </p>
                                {user && (
                                    <p className="text-sm font-medium pb-2">
                                        Welcome, {user.firstName}
                                    </p>
                                )}
                                <nav className="space-y-1">
                                    {accountLinks.map((link) => (
                                        <SheetClose asChild key={link.href}>
                                            <Link
                                                href={link.href}
                                                className="flex items-center gap-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <link.icon className="h-4 w-4" />
                                                {link.label}
                                            </Link>
                                        </SheetClose>
                                    ))}
                                </nav>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <SheetClose asChild>
                                    <Link href="/login" className="block">
                                        <Button className="w-full">
                                            Login
                                        </Button>
                                    </Link>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Link href="/register" className="block">
                                        <Button variant="outline" className="w-full">
                                            Create Account
                                        </Button>
                                    </Link>
                                </SheetClose>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
