import { Suspense } from 'react';
import { Metadata } from 'next';
import { EmailVerificationForm } from '@/components/forms/email-verification-form';
import { AuthPageGuard } from '@/components/auth/auth-page-guard';

export const metadata: Metadata = {
  title: 'Verify Email | Lab404 Electronics',
  description: 'Verify your email address to activate your account',
};

export default function VerifyEmailPage() {
  return (
    <AuthPageGuard>
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8 px-4">
        <Suspense fallback={<div>Loading...</div>}>
          <EmailVerificationForm />
        </Suspense>
      </div>
    </AuthPageGuard>
  );
}
