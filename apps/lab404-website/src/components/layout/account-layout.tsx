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
            <div className="container py-6 md:py-10">
                <div className="flex flex-col gap-6 md:gap-8 lg:flex-row">
                    <aside className="w-full lg:w-64 lg:flex-shrink-0">
                        <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
                            {sidebarItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground whitespace-nowrap min-h-[44px] min-w-[44px] transition-colors',
                                        pathname === item.href ? 'bg-accent text-accent-foreground' : 'transparent'
                                    )}
                                >
                                    <item.icon className="h-4 w-4 flex-shrink-0" />
                                    <span className="hidden sm:inline">{item.title}</span>
                                </Link>
                            ))}
                            <Button
                                variant="ghost"
                                className="justify-start gap-2 px-4 py-3 text-destructive hover:text-destructive hover:bg-destructive/10 whitespace-nowrap min-h-[44px]"
                                onClick={() => logout()}
                            >
                                <LogOut className="h-4 w-4 flex-shrink-0" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </nav>
                    </aside>
                    <div className="flex-1 min-w-0">{children}</div>
                </div>
            </div>
        </MainLayout>
    );
}
