'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SessionItem } from './SessionItem';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

export function SessionList() {
  const {
    activeSessions,
    sessionsLoading,
    sessionsError,
    fetchActiveSessions,
    revokeSession,
    logoutOthers,
  } = useAuthStore();

  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [showLogoutOthersDialog, setShowLogoutOthersDialog] = useState(false);

  // Fetch sessions on mount
  useEffect(() => {
    fetchActiveSessions();
  }, [fetchActiveSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      await revokeSession(sessionId);
      toast.success('Session Logged Out', {
        description: 'The session has been successfully revoked.',
      });
    } catch (error) {
      toast.error('Failed to Logout Session', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleLogoutOthers = async () => {
    try {
      const result = await logoutOthers();
      toast.success('Other Sessions Logged Out', {
        description: `${result.count} session(s) have been logged out.`,
      });
      setShowLogoutOthersDialog(false);
    } catch (error) {
      toast.error('Failed to Logout Sessions', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  };

  // Loading state
  if (sessionsLoading && activeSessions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (sessionsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{sessionsError}</AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (activeSessions.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Active Sessions</AlertTitle>
        <AlertDescription>
          You don't have any active sessions. This is unusual - you should see at least your current session.
        </AlertDescription>
      </Alert>
    );
  }

  // Count other sessions
  const otherSessionsCount = activeSessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="space-y-6">
      {/* Header with bulk action */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold">Active Sessions</h3>
          <p className="text-sm text-muted-foreground">
            {activeSessions.length} active session{activeSessions.length !== 1 && 's'}
          </p>
        </div>

        {otherSessionsCount > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowLogoutOthersDialog(true)}
            disabled={sessionsLoading}
            style={{ minHeight: '44px' }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout All Other Sessions ({otherSessionsCount})
          </Button>
        )}
      </div>

      {/* Session list */}
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {activeSessions.map((session) => (
          <SessionItem
            key={session.id}
            session={session}
            onRevoke={handleRevokeSession}
            isRevoking={revokingSessionId === session.id}
          />
        ))}
      </div>

      {/* Logout Others Confirmation Dialog */}
      <AlertDialog open={showLogoutOthersDialog} onOpenChange={setShowLogoutOthersDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout All Other Sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will log you out of all devices except this one. You'll need to sign in again on those devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutOthers}>
              Logout {otherSessionsCount} Session{otherSessionsCount !== 1 && 's'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
