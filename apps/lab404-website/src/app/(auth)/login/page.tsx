import { LoginForm } from '@/components/forms/login-form';
import { AuthPageGuard } from '@/components/auth/auth-page-guard';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Login',
};

export default function LoginPage() {
    return (
        <AuthPageGuard>
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoginForm />
            </div>
        </AuthPageGuard>
    );
}
