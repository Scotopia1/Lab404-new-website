import { LoginForm } from '@/components/forms/login-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Login',
};

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <LoginForm />
        </div>
    );
}
