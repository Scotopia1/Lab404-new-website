import { RegisterForm } from '@/components/forms/register-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Create Account',
};

export default function RegisterPage() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <RegisterForm />
        </div>
    );
}
