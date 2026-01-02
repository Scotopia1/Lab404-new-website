'use client';

import MainLayout from '@/components/layout/main-layout';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User, Package, MapPin, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';

const sidebarItems = [
    {
        title: 'Profile',
        href: '/account/profile',
        icon: User,
    },
    {
        title: 'Orders',
        href: '/account/orders',
        icon: Package,
    },
    {
        title: 'Addresses',
        href: '/account/addresses',
        icon: MapPin,
    },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logout } = useAuthStore();

    return (
        <MainLayout>
            <div className="container py-10">
                <div className="flex flex-col gap-8 lg:flex-row">
                    <aside className="w-full lg:w-64">
                        <nav className="flex flex-col gap-2">
                            {sidebarItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                                        pathname === item.href ? 'bg-accent text-accent-foreground' : 'transparent'
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.title}
                                </Link>
                            ))}
                            <Button
                                variant="ghost"
                                className="justify-start gap-2 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => logout()}
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </Button>
                        </nav>
                    </aside>
                    <div className="flex-1">{children}</div>
                </div>
            </div>
        </MainLayout>
    );
}
