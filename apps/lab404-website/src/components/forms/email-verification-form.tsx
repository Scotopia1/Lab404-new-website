'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';
import { verifyEmailSchema, type VerifyEmailFormData } from '@/lib/validations/email-verification';

export function EmailVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { verifyEmail, resendVerificationEmail, isLoading } = useAuthStore();

  // Get email from URL params or store
  const emailParam = searchParams.get('email');
  const [email] = useState(emailParam || '');
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: email,
      code: '',
    },
  });

  const onSubmit = async (data: VerifyEmailFormData) => {
    try {
      await verifyEmail(data.email, data.code);

      toast({
        title: 'Email Verified!',
        description: 'Your account has been activated successfully.',
      });

      // Redirect to account page
      router.push('/account');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: error instanceof Error ? error.message : 'Invalid or expired code',
      });
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    try {
      await resendVerificationEmail(email);

      toast({
        title: 'Code Resent',
        description: 'A new verification code has been sent to your email.',
      });

      // Start 60-second cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Resend',
        description: 'Please try again later.',
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Verify Your Email</h1>
        <p className="text-sm text-muted-foreground">
          We've sent a 6-digit verification code to <strong>{email}</strong>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Hidden email field */}
        <input type="hidden" {...register('email')} />

        {/* Verification Code Input */}
        <div className="space-y-2">
          <Label htmlFor="code">Verification Code</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            className="text-center text-2xl tracking-widest font-mono"
            style={{ fontSize: '24px' }}
            {...register('code')}
            aria-invalid={errors.code ? 'true' : 'false'}
            onPaste={(e) => {
              // Allow pasting codes
              const paste = e.clipboardData.getData('text');
              const digits = paste.replace(/\D/g, '').slice(0, 6);
              if (digits) {
                setValue('code', digits);
                e.preventDefault();
              }
            }}
          />
          {errors.code && (
            <p className="text-sm text-destructive">{errors.code.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isLoading}
          style={{ minHeight: '44px' }}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Email'
          )}
        </Button>
      </form>

      {/* Resend Section */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Didn't receive the code?
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleResendCode}
          disabled={isLoading || resendCooldown > 0}
          className="w-full sm:w-auto"
          style={{ minHeight: '44px' }}
        >
          {resendCooldown > 0 ? (
            `Resend in ${resendCooldown}s`
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend Code
            </>
          )}
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Code expires in 15 minutes. Check your spam folder if you don't see the email.
        </p>
      </div>
    </div>
  );
}
