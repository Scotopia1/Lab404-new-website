'use client';

import { Check, Clock, Package, Truck, MapPin, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrackingTimeline } from '@/hooks/use-track-order';

interface OrderTimelineProps {
  status: string;
  timeline: TrackingTimeline[];
}

const statusConfig: Record<string, { icon: React.ElementType; label: string }> = {
  pending: { icon: Clock, label: 'Order Placed' },
  confirmed: { icon: Check, label: 'Order Confirmed' },
  processing: { icon: Package, label: 'Processing' },
  shipped: { icon: Truck, label: 'Shipped' },
  delivered: { icon: MapPin, label: 'Delivered' },
  cancelled: { icon: XCircle, label: 'Cancelled' },
};

const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

export function OrderTimeline({ status, timeline }: OrderTimelineProps) {
  const isCancelled = status === 'cancelled';
  const currentIndex = isCancelled ? -1 : statusOrder.indexOf(status);

  // If cancelled, show special cancelled state
  if (isCancelled) {
    const placedEvent = timeline.find(t => t.status === 'pending');
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-red-500 text-white">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-red-700">Order Cancelled</p>
            {placedEvent && (
              <p className="text-sm text-red-600">
                Originally placed on {formatDateTime(placedEvent.timestamp)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {statusOrder.map((stepStatus, index) => {
        const config = statusConfig[stepStatus];
        const timelineEntry = timeline.find(t => t.status === stepStatus);
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isFuture = index > currentIndex;

        // Only show future step if it's the next one
        if (isFuture && index > currentIndex + 1) return null;

        const Icon = config.icon;

        return (
          <div key={stepStatus} className="relative">
            {/* Connector line */}
            {index < statusOrder.length - 1 && index <= currentIndex && (
              <div
                className={cn(
                  'absolute left-[18px] top-[40px] w-0.5 h-[calc(100%-16px)]',
                  isCompleted || isActive ? 'bg-primary' : 'bg-gray-200'
                )}
              />
            )}

            <div className="flex items-start gap-4 pb-6">
              <div
                className={cn(
                  'p-2.5 rounded-full shrink-0 z-10',
                  isActive && 'bg-primary text-white ring-4 ring-primary/20',
                  isCompleted && 'bg-primary text-white',
                  isFuture && 'bg-gray-100 text-gray-400'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="pt-1">
                <p
                  className={cn(
                    'font-medium',
                    (isActive || isCompleted) && 'text-gray-900',
                    isFuture && 'text-gray-400'
                  )}
                >
                  {config.label}
                </p>
                {timelineEntry && (isActive || isCompleted) && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {formatDateTime(timelineEntry.timestamp)}
                  </p>
                )}
                {timelineEntry?.description && (isActive || isCompleted) && (
                  <p className="text-sm text-gray-600 mt-1">
                    {timelineEntry.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
