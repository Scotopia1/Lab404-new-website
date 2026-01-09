import { PasswordResetForm } from '@/components/forms/password-reset-form';

export const metadata = {
  title: 'Reset Password | Lab404 Electronics',
  description: 'Reset your account password',
};

export default function ResetPasswordPage() {
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
      <PasswordResetForm />
    </div>
  );
}
