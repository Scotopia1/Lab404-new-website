'use client';

import AccountLayout from '@/components/layout/account-layout';
import { SessionList } from '@/components/account/SessionList';

export default function SecurityPage() {
  return (
    <AccountLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security</h1>
          <p className="text-muted-foreground mt-2">
            Manage your active sessions and devices
          </p>
        </div>

        <SessionList />
      </div>
    </AccountLayout>
  );
}
