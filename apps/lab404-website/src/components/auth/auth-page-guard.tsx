'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';

interface AuthPageGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Prevents authenticated users from accessing auth pages (login, register, etc.)
 * Redirects logged-in users to their account page or specified route
 */
export function AuthPageGuard({ children, redirectTo = '/account/profile' }: AuthPageGuardProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (isAuthenticated && user) {
      // User is logged in, redirect away from auth pages
      router.replace(redirectTo);
    }
  }, [isAuthenticated, user, router, redirectTo]);

  // Show loading state while checking auth
  // This prevents flash of auth form before redirect
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
