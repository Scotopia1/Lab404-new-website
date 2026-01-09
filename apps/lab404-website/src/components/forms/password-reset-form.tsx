'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';

import {
  forgotPasswordSchema,
  verifyCodeSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type VerifyCodeInput,
  type ResetPasswordInput,
} from '@/lib/validations/password-reset';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Step = 'email' | 'code' | 'password';

export function PasswordResetForm() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const { forgotPassword, verifyResetCode, resetPassword, isLoading } = useAuthStore();

  // Step 1: Email Form
  const emailForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const handleEmailSubmit = async (data: ForgotPasswordInput) => {
    setError(null);
    try {
      await forgotPassword(data.email);
      setEmail(data.email);
      setStep('code');
      toast.success('Check your email for the verification code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code');
    }
  };

  // Step 2: Code Form
  const codeForm = useForm<VerifyCodeInput>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: '' },
  });

  const handleCodeSubmit = async (data: VerifyCodeInput) => {
    setError(null);
    try {
      await verifyResetCode(email, data.code);
      setCode(data.code);
      setStep('password');
      toast.success('Code verified successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code');
    }
  };

  // Step 3: Password Form
  const passwordForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const handlePasswordSubmit = async (data: ResetPasswordInput) => {
    setError(null);
    try {
      await resetPassword(email, code, data.newPassword);
      toast.success('Password reset successfully! You are now logged in.');
      router.push('/account/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  // Helper functions
  const goBackToEmail = () => {
    setStep('email');
    setError(null);
    codeForm.reset();
  };

  const handlePasteCode = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedText)) {
      codeForm.setValue('code', pastedText);
      e.preventDefault();
    }
  };

  // Email Step Component
  const EmailStep = () => (
    <Form {...emailForm}>
      <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
        <FormField
          control={emailForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  autoFocus
                  disabled={isLoading}
                  className="text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isLoading || !emailForm.formState.isValid}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Sending Code...' : 'Send Reset Code'}
        </Button>
      </form>
    </Form>
  );

  // Code Step Component
  const CodeStep = () => (
    <div className="space-y-4">
      <div className="p-3 bg-muted rounded-md">
        <p className="text-sm text-muted-foreground">Code sent to:</p>
        <div className="flex items-center justify-between">
          <p className="font-medium">{email}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={goBackToEmail}
            disabled={isLoading}
          >
            Edit
          </Button>
        </div>
      </div>

      <Form {...codeForm}>
        <form onSubmit={codeForm.handleSubmit(handleCodeSubmit)} className="space-y-4">
          <FormField
            control={codeForm.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Code</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    autoFocus
                    disabled={isLoading}
                    onPaste={handlePasteCode}
                    className="text-center text-2xl tracking-widest font-mono text-base"
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  Code expires in 15 minutes
                </p>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isLoading || !codeForm.formState.isValid}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={goBackToEmail}
              disabled={isLoading}
              className="text-sm text-primary hover:underline"
            >
              Didn&apos;t receive code? Resend
            </button>
          </div>
        </form>
      </Form>
    </div>
  );

  // Password Step Component
  const PasswordStep = () => (
    <Form {...passwordForm}>
      <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
        <FormField
          control={passwordForm.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    autoFocus
                    disabled={isLoading}
                    className="pr-10 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                Must contain uppercase, lowercase, and number
              </p>
            </FormItem>
          )}
        />

        <FormField
          control={passwordForm.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    disabled={isLoading}
                    className="pr-10 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isLoading || !passwordForm.formState.isValid}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Resetting Password...' : 'Reset Password'}
        </Button>
      </form>
    </Form>
  );

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          {step === 'email' && 'Enter your email address to receive a reset code'}
          {step === 'code' && 'Enter the 6-digit code sent to your email'}
          {step === 'password' && 'Create your new password'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {step === 'email' && <EmailStep />}
        {step === 'code' && <CodeStep />}
        {step === 'password' && <PasswordStep />}
      </CardContent>
    </Card>
  );
}
