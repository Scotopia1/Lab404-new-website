import { Metadata } from 'next';
import { SessionList } from '@/components/account/SessionList';

export const metadata: Metadata = {
  title: 'Security | Lab404 Electronics',
  description: 'Manage your active sessions and account security',
};

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security</h1>
        <p className="text-muted-foreground mt-2">
          Manage your active sessions and devices
        </p>
      </div>

      <SessionList />
    </div>
  );
}
