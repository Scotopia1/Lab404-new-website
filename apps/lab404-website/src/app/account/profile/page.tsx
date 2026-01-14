'use client';

import AccountLayout from '@/components/layout/account-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Calendar, ShoppingBag, Mail } from 'lucide-react';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { PasswordChangeForm } from '@/components/profile/password-change-form';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().max(50).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: profile ? {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || '',
    } : undefined,
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync(data);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <AccountLayout>
        <div className="space-y-4 md:space-y-6">
          <Skeleton className="h-10 md:h-12 w-48 md:w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-5 md:h-6 w-24 md:w-32" />
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </AccountLayout>
    );
  }

  if (error || !profile) {
    return (
      <AccountLayout>
        <Card>
          <CardContent className="py-6 md:py-8 text-center">
            <p className="text-sm md:text-base text-destructive">Failed to load profile</p>
          </CardContent>
        </Card>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your personal information and password.
          </p>
        </div>

        {/* Account Stats */}
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Member Since</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">
                {profile.createdAt ? format(new Date(profile.createdAt), 'MMM yyyy') : 'N/A'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{profile.orderCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Email</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xs md:text-sm truncate">{profile.email}</div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Form */}
        <Card>
          <CardHeader className="pb-4 md:pb-6">
            <CardTitle className="text-base md:text-lg">Personal Information</CardTitle>
            <CardDescription className="text-xs md:text-sm">Update your name and contact details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm">First Name</Label>
                  <Input id="firstName" {...register('firstName')} className="min-h-[44px]" />
                  {errors.firstName && (
                    <p className="text-xs md:text-sm text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                  <Input id="lastName" {...register('lastName')} className="min-h-[44px]" />
                  {errors.lastName && (
                    <p className="text-xs md:text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm">Phone (Optional)</Label>
                <Input id="phone" type="tel" {...register('phone')} className="min-h-[44px]" />
                {errors.phone && (
                  <p className="text-xs md:text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input id="email" type="email" value={profile.email} disabled className="min-h-[44px]" />
                <p className="text-xs text-muted-foreground">
                  Contact support to change your email address
                </p>
              </div>
              <Button type="submit" disabled={updateProfile.isPending} className="min-h-[44px] px-6">
                {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader className="pb-4 md:pb-6">
            <CardTitle className="text-base md:text-lg">Password</CardTitle>
            <CardDescription className="text-xs md:text-sm">Change your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordChangeForm />
          </CardContent>
        </Card>
      </div>
    </AccountLayout>
  );
}
