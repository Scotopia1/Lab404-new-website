'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';

export default function AccountRouteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, checkAuth } = useAuthStore();

    useEffect(() => {
        // Check authentication status on mount
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!isAuthenticated) {
            router.push('/login?redirect=/account/profile');
        }
    }, [isAuthenticated, router]);

    // Show loading while checking auth
    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return children;
}
