import { RegisterForm } from '@/components/forms/register-form';
import { AuthPageGuard } from '@/components/auth/auth-page-guard';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Create Account',
};

export default function RegisterPage() {
    return (
        <AuthPageGuard>
            <div className="flex items-center justify-center min-h-[60vh]">
                <RegisterForm />
            </div>
        </AuthPageGuard>
    );
}
