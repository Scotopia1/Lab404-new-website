import { PasswordResetForm } from '@/components/forms/password-reset-form';
import { AuthPageGuard } from '@/components/auth/auth-page-guard';

export const metadata = {
  title: 'Reset Password | Lab404 Electronics',
  description: 'Reset your account password',
};

export default function ResetPasswordPage() {
  return (
    <AuthPageGuard>
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
        <PasswordResetForm />
      </div>
    </AuthPageGuard>
  );
}
