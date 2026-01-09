'use client';

import { useState } from 'react';
import { Monitor, Smartphone, Tablet, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Session } from '@/types/session';

interface SessionItemProps {
  session: Session;
  onRevoke: (sessionId: string) => void;
  isRevoking: boolean;
}

export function SessionItem({ session, onRevoke, isRevoking }: SessionItemProps) {
  // Device icon based on type
  const DeviceIcon = session.deviceType === 'mobile'
    ? Smartphone
    : session.deviceType === 'tablet'
    ? Tablet
    : Monitor;

  // Format activity time
  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const diffMs = Date.now() - date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 7) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, 'MMM d, yyyy');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <DeviceIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">
                  {session.deviceName}
                </CardTitle>
                {session.isCurrent && (
                  <Badge variant="secondary" className="text-xs">
                    This device
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-1">
                {session.deviceBrowser} {session.browserVersion && `(${session.browserVersion})`}
                {' • '}
                {session.osName} {session.osVersion}
              </CardDescription>
            </div>
          </div>

          {/* Logout button (hidden for current session) */}
          {!session.isCurrent && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRevoke(session.id)}
              disabled={isRevoking}
              className="h-9 w-9 flex-shrink-0"
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-label="Logout this session"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          {/* IP Address */}
          <div className="flex items-center justify-between">
            <span>IP Address:</span>
            <span className="font-mono">{session.ipAddress}</span>
          </div>

          {/* Last Activity */}
          <div className="flex items-center justify-between">
            <span>Last Activity:</span>
            <span>{formatActivityTime(session.lastActivityAt)}</span>
          </div>

          {/* Login Time */}
          <div className="flex items-center justify-between">
            <span>Signed in:</span>
            <span>{formatActivityTime(session.loginAt)}</span>
          </div>

          {/* Location (if available) */}
          {(session.ipCity || session.ipCountry) && (
            <div className="flex items-center justify-between">
              <span>Location:</span>
              <span>
                {session.ipCity}
                {session.ipCity && session.ipCountry && ', '}
                {session.ipCountry}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
